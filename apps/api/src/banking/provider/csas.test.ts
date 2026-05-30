import { describe, it, expect, vi, beforeEach } from "vitest";
import { CsasProvider } from "./csas";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockResolvedValue("fake-cert"),
}));

vi.mock("@mng/logger/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("../../revolut/revolut.repository", () => ({
  RevolutRepository: {
    upsertAccount: vi.fn().mockResolvedValue({}),
    upsertTransaction: vi.fn().mockResolvedValue({}),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockHttpsRequest = vi.fn();
vi.mock("node:https", () => ({
  default: { request: mockHttpsRequest },
  request: mockHttpsRequest,
}));

function mockHttpsResponse(statusCode: number, body: string): void {
  const chunks = body.split("").map((c) => Buffer.from(c));
  const res = {
    statusCode,
    headers: { "content-type": "application/json" },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === "data") chunks.forEach((c) => handler(c));
      if (event === "end") handler();
      return res;
    }),
  };
  const req = { on: vi.fn(), write: vi.fn(), end: vi.fn() };
  mockHttpsRequest.mockImplementation((_opts, cb: (r: typeof res) => void) => {
    cb(res);
    return req;
  });
}

function makeProvider(): CsasProvider {
  vi.stubGlobal("process", {
    ...process,
    env: {
      CSAS_CLIENT_ID: "test-client",
      CSAS_CLIENT_SECRET: "test-secret",
      CSAS_CERT_PATH: "/path/to/cert.pem",
      CSAS_API_KEY: "sandbox",
      API_URL: "http://localhost:3000",
    },
  });
  return new CsasProvider();
}

describe("CsasProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("interface contract", () => {
    it("has correct name and providerType", () => {
      const provider = makeProvider();
      expect(provider.name).toBe("csas");
      expect(provider.providerType).toBe("psd2");
    });
  });

  describe("getAuthUrl", () => {
    it("initiates consent and returns auth URL", async () => {
      mockHttpsResponse(
        201,
        JSON.stringify({
          consentId: "csas-cons-1",
          _links: { scaRedirect: { href: "https://csas.cz/auth" } },
        }),
      );

      const provider = makeProvider();
      const url = await provider.getAuthUrl(
        "user-1",
        "http://localhost:3000/callback",
      );

      expect(url).toBe("https://csas.cz/auth");
      expect(mockHttpsRequest).toHaveBeenCalledOnce();
    });
  });

  describe("handleCallback", () => {
    it("exchanges code and stores tokens", async () => {
      mockHttpsResponse(
        201,
        JSON.stringify({
          consentId: "csas-cons-1",
          _links: { scaRedirect: { href: "https://csas.cz/auth" } },
        }),
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "acc-token",
            refresh_token: "ref-token",
            expires_in: 3600,
          }),
      });

      const provider = makeProvider();
      await provider.getAuthUrl("user-1", "http://localhost:3000/callback");
      await provider.handleCallback("user-1", "auth-code-123");

      expect(await provider.isConnected("user-1")).toBe(true);
    });

    it("throws when no pending consent", async () => {
      const provider = makeProvider();
      await expect(
        provider.handleCallback("unknown-user", "code"),
      ).rejects.toThrow("No pending consent");
    });
  });

  describe("isConnected", () => {
    it("returns false for unknown users", async () => {
      const provider = makeProvider();
      expect(await provider.isConnected("no-such-user")).toBe(false);
    });
  });

  describe("syncAccounts", () => {
    it("fetches accounts and upserts via repository", async () => {
      mockHttpsResponse(
        201,
        JSON.stringify({
          consentId: "csas-cons-1",
          _links: { scaRedirect: { href: "https://csas.cz/auth" } },
        }),
      );
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "acc-token",
            refresh_token: "ref-token",
            expires_in: 99999,
          }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            accounts: [
              {
                resourceId: "res-1",
                iban: "CZ6500000000000000000000",
                currency: "CZK",
                name: "Běžný účet",
                product: "Osobní účet",
                cashAccountType: "CACC",
                status: "enabled",
                balances: [
                  {
                    balanceAmount: { amount: "25000.00", currency: "CZK" },
                    balanceType: "closingBooked",
                  },
                ],
              },
              {
                resourceId: "res-2",
                iban: "CZ6500000000000000000001",
                currency: "CZK",
                name: "Spořicí účet",
                product: "Spořicí účet",
                cashAccountType: "SVGS",
                status: "enabled",
                balances: [],
              },
            ],
          }),
      });

      const { RevolutRepository } = await import(
        "../../revolut/revolut.repository"
      );
      const provider = makeProvider();
      await provider.getAuthUrl("user-1", "http://localhost:3000/callback");
      await provider.handleCallback("user-1", "code");

      const result = await provider.syncAccounts("user-1");

      expect(result.accountsSynced).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(RevolutRepository.upsertAccount).toHaveBeenCalledTimes(2);
      expect(RevolutRepository.upsertAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          revolutAccountId: "csas_res-1",
          userId: "user-1",
          currency: "CZK",
          iban: "CZ6500000000000000000000",
          balance: 25000,
        }),
      );
    });
  });

  describe("syncTransactions", () => {
    it("fetches transactions and upserts via repository", async () => {
      mockHttpsResponse(
        201,
        JSON.stringify({
          consentId: "csas-cons-1",
          _links: { scaRedirect: { href: "https://csas.cz/auth" } },
        }),
      );
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "acc-token",
            refresh_token: "ref-token",
            expires_in: 99999,
          }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            transactions: {
              booked: [
                {
                  transactionId: "tx-1",
                  bookingDate: "2026-05-15",
                  valueDate: "2026-05-15",
                  transactionAmount: { amount: "-1500.00", currency: "CZK" },
                  creditorName: "Obchod s.r.o.",
                  debtorName: "",
                  remittanceInformationUnstructured: "Platba za zboží",
                  bankTransactionCode: "PMNT-CCRD",
                  proprietaryBankTransactionCode: "",
                },
                {
                  transactionId: "tx-2",
                  bookingDate: "2026-05-14",
                  valueDate: "2026-05-14",
                  transactionAmount: { amount: "50000.00", currency: "CZK" },
                  creditorName: "",
                  debtorName: "Můj zaměstnavatel a.s.",
                  remittanceInformationUnstructured: "Mzda 05/2026",
                  bankTransactionCode: "PMNT-DD",
                  proprietaryBankTransactionCode: "",
                },
              ],
              pending: [],
            },
          }),
      });

      const { RevolutRepository } = await import(
        "../../revolut/revolut.repository"
      );
      const provider = makeProvider();
      await provider.getAuthUrl("user-1", "http://localhost:3000/callback");
      await provider.handleCallback("user-1", "code");

      const result = await provider.syncTransactions("user-1", "csas_res-1");

      expect(result.transactionsSynced).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(RevolutRepository.upsertTransaction).toHaveBeenCalledTimes(2);
      expect(RevolutRepository.upsertTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          revolutTransactionId: "csas_tx-1",
          direction: "debit",
          amount: 1500,
          currency: "CZK",
          counterParty: "Obchod s.r.o.",
          description: "Platba za zboží",
        }),
      );
      expect(RevolutRepository.upsertTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          revolutTransactionId: "csas_tx-2",
          direction: "credit",
          amount: 50000,
          description: "Mzda 05/2026",
        }),
      );
    });
  });

  describe("disconnect", () => {
    it("removes user state", async () => {
      const provider = makeProvider();
      await provider.disconnect("user-1");
      expect(await provider.isConnected("user-1")).toBe(false);
    });
  });
});
