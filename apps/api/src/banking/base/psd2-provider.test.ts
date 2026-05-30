import { describe, it, expect, vi, beforeEach } from "vitest";
import { PSD2BaseProvider } from "./psd2-provider";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockResolvedValue("fake-cert-content"),
}));

vi.mock("@mng/logger/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockHttpsRequest = vi.fn();
vi.mock("node:https", () => ({
  default: {
    request: mockHttpsRequest,
  },
  request: mockHttpsRequest,
}));

function makeProvider(): PSD2BaseProvider {
  return new PSD2BaseProvider({
    clientId: "test-client",
    clientSecret: "test-secret",
    baseUrl: "https://api.test.com/v1",
    certPath: "/path/to/cert.pem",
    certKeyPath: "/path/to/key.pem",
  });
}

function mockHttpsResponse(statusCode: number, body: string): void {
  const chunks = body.split("").map((c) => Buffer.from(c));
  const res = {
    statusCode,
    statusMessage: statusCode === 201 ? "Created" : "OK",
    headers: { "content-type": "application/json" },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === "data") {
        chunks.forEach((chunk) => handler(chunk));
      }
      if (event === "end") {
        handler();
      }
      return res;
    }),
  };
  const req = {
    on: vi.fn((_event: string, _handler: (...args: unknown[]) => void) => req),
    write: vi.fn(),
    end: vi.fn(),
  };
  mockHttpsRequest.mockImplementation((_opts, cb: (r: typeof res) => void) => {
    cb(res);
    return req;
  });
  return req;
}

describe("PSD2BaseProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initiateConsent", () => {
    it("initiates consent and returns consentId + authUrl", async () => {
      mockHttpsResponse(
        201,
        JSON.stringify({
          consentId: "cons-123",
          _links: {
            scaRedirect: { href: "https://auth.test.com/auth" },
          },
        }),
      );

      const provider = makeProvider();
      const result = await provider.initiateConsent(
        ["accounts", "transactions"],
        "https://app.test.com/callback",
      );

      expect(result.consentId).toBe("cons-123");
      expect(result.authUrl).toBe("https://auth.test.com/auth");
      expect(mockHttpsRequest).toHaveBeenCalledOnce();
      const opts = mockHttpsRequest.mock.calls[0][0];
      expect(opts.method).toBe("POST");
      expect(opts.path).toBe("/consents");
      expect(opts.hostname).toBe("api.test.com");
      expect(opts.cert).toBe("fake-cert-content");
      expect(opts.key).toBe("fake-cert-content");
    });

    it("uses redirect URL when scaOAuth is provided", async () => {
      mockHttpsResponse(
        201,
        JSON.stringify({
          consentId: "cons-456",
          _links: {
            scaOAuth: { href: "https://oauth.test.com/authorize" },
          },
        }),
      );

      const provider = makeProvider();
      const result = await provider.initiateConsent(
        ["accounts"],
        "https://app.test.com/callback",
      );

      expect(result.consentId).toBe("cons-456");
      expect(result.authUrl).toBe("https://oauth.test.com/authorize");
    });

    it("throws on error response", async () => {
      mockHttpsResponse(400, JSON.stringify({ message: "Bad request" }));

      const provider = makeProvider();
      await expect(
        provider.initiateConsent(["accounts"], "https://app.test.com/callback"),
      ).rejects.toThrow("PSD2 consent failed: 400");
    });
  });

  describe("exchangeCode", () => {
    it("exchanges authorization code for tokens", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "acc-token-123",
            refresh_token: "ref-token-456",
            expires_in: 3600,
          }),
      });

      const provider = makeProvider();
      const result = await provider.exchangeCode(
        "auth-code-xyz",
        "https://app.test.com/callback",
      );

      expect(result.accessToken).toBe("acc-token-123");
      expect(result.refreshToken).toBe("ref-token-456");
      expect(result.expiresAt).toBeGreaterThan(Date.now() / 1000);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toBe("https://api.test.com/v1/token");

      const callOpts = mockFetch.mock.calls[0][1];
      expect(callOpts.method).toBe("POST");
      expect(callOpts.headers.Authorization).toMatch(/^Basic /);
    });

    it("throws on error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve("invalid_grant"),
      });

      const provider = makeProvider();
      await expect(
        provider.exchangeCode("bad-code", "https://app.test.com/callback"),
      ).rejects.toThrow();
    });
  });

  describe("refreshToken", () => {
    it("refreshes an expired token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "new-acc-token",
            refresh_token: "new-ref-token",
            expires_in: 3600,
          }),
      });

      const provider = makeProvider();
      const result = await provider.refreshToken("old-ref-token");

      expect(result.accessToken).toBe("new-acc-token");
      expect(result.refreshToken).toBe("new-ref-token");

      const body = mockFetch.mock.calls[0][1].body;
      expect(body.get("grant_type")).toBe("refresh_token");
      expect(body.get("refresh_token")).toBe("old-ref-token");
    });
  });

  describe("getAccounts", () => {
    it("fetches and returns accounts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            accounts: [
              {
                resourceId: "acc-1",
                iban: "CZ123456789",
                currency: "CZK",
                name: "Běžný účet",
                product: "Osobní účet",
                cashAccountType: "CACC",
                status: "enabled",
              },
            ],
          }),
      });

      const provider = makeProvider();
      const accounts = await provider.getAccounts("valid-token");

      expect(accounts).toHaveLength(1);
      expect(accounts[0].resourceId).toBe("acc-1");
      expect(accounts[0].cashAccountType).toBe("CACC");
    });

    it("throws on 401 consent expired", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      const provider = makeProvider();
      await expect(provider.getAccounts("expired-token")).rejects.toThrow(
        "consent expired",
      );
    });

    it("throws on 403 SCA required", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      const provider = makeProvider();
      await expect(provider.getAccounts("sca-token")).rejects.toThrow(
        "SCA required",
      );
    });
  });

  describe("getTransactions", () => {
    it("fetches and returns transactions", async () => {
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
              ],
              pending: [],
            },
          }),
      });

      const provider = makeProvider();
      const txs = await provider.getTransactions("valid-token", "acc-1");

      expect(txs).toHaveLength(1);
      expect(txs[0].transactionId).toBe("tx-1");
      expect(txs[0].transactionAmount.amount).toBe("-1500.00");
    });

    it("includes dateFrom and dateTo query params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ transactions: { booked: [], pending: [] } }),
      });

      const provider = makeProvider();
      await provider.getTransactions(
        "token",
        "acc-1",
        new Date("2026-01-01"),
        new Date("2026-01-31"),
      );

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("dateFrom=2026-01-01");
      expect(url).toContain("dateTo=2026-01-31");
      expect(url).toContain("bookingStatus=both");
    });
  });
});
