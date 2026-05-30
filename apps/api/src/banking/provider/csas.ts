import { logger } from "@mng/logger/logger";
import { RevolutRepository } from "../../revolut/revolut.repository";
import type { BankingProvider, SyncResult } from "../types";
import { PSD2BaseProvider } from "../base/psd2-provider";

const CSAS_SANDBOX_URL = "https://api.csas.cz/sandbox/v1";
const CSAS_PROD_URL = "https://api.csas.cz/v1";

interface CSASUserState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  consentId: string;
}

export class CsasProvider extends PSD2BaseProvider implements BankingProvider {
  readonly name = "csas";
  readonly providerType = "psd2" as const;

  private userStates = new Map<string, CSASUserState>();

  constructor() {
    const clientId = process.env.CSAS_CLIENT_ID ?? "";
    const clientSecret = process.env.CSAS_CLIENT_SECRET ?? "";
    const certPath = process.env.CSAS_CERT_PATH ?? "";
    const isSandbox = process.env.CSAS_API_KEY === "sandbox";
    const baseUrl = isSandbox ? CSAS_SANDBOX_URL : CSAS_PROD_URL;

    super({ clientId, clientSecret, baseUrl, certPath });
  }

  async getAuthUrl(userId: string, redirectUri: string): Promise<string> {
    const { consentId, authUrl } = await this.initiateConsent(
      ["accounts", "transactions"],
      redirectUri,
    );

    this.setUserState(userId, { consentId });

    logger.info(`CSAS consent initiated for user ${userId}: ${consentId}`);
    return authUrl;
  }

  async handleCallback(userId: string, code: string): Promise<void> {
    const state = this.userStates.get(userId);
    if (!state?.consentId) {
      throw new Error("No pending consent for this user");
    }

    const redirectUri = `${process.env.API_URL ?? "http://localhost:3000"}/banking/callback`;
    const tokens = await this.exchangeCode(code, redirectUri);

    this.setUserState(userId, {
      consentId: state.consentId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });

    logger.info(`CSAS connected for user ${userId}`);
  }

  async isConnected(userId: string): Promise<boolean> {
    const state = this.userStates.get(userId);
    if (!state?.accessToken) return false;

    if (Date.now() / 1000 >= state.expiresAt) {
      try {
        const tokens = await this.refreshToken(state.refreshToken);
        this.setUserState(userId, {
          consentId: state.consentId,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        });
        return true;
      } catch {
        this.userStates.delete(userId);
        return false;
      }
    }

    return true;
  }

  async disconnect(userId: string): Promise<void> {
    this.userStates.delete(userId);
    logger.info(`CSAS disconnected for user ${userId}`);
  }

  async syncAccounts(userId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let accountsSynced = 0;

    try {
      const token = await this.getValidToken(userId);
      const accounts = await this.getAccounts(token);

      for (const acc of accounts) {
        const accountId = `csas_${acc.resourceId}`;
        const balance = acc.balances?.find(
          (b) => b.balanceType === "closingBooked",
        );

        await RevolutRepository.upsertAccount({
          revolutAccountId: accountId,
          userId,
          name: acc.name ?? `CSAS Account ${acc.iban}`,
          type: mapCSASAccountType(acc.cashAccountType),
          balance: balance ? Number(balance.balanceAmount.amount) : 0,
          currency: acc.currency,
          accountNumber: acc.iban,
          sortCode: null,
          iban: acc.iban,
          isActive: acc.status === "enabled",
          lastSyncedAt: new Date(),
        });
        accountsSynced++;
      }

      logger.info(`CSAS synced ${accountsSynced} accounts for user ${userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`CSAS syncAccounts error: ${message}`);
      errors.push(message);
    }

    return { accountsSynced, transactionsSynced: 0, errors };
  }

  async syncTransactions(
    userId: string,
    accountId: string,
    from?: Date,
    to?: Date,
  ): Promise<SyncResult> {
    const errors: string[] = [];
    let transactionsSynced = 0;

    try {
      const token = await this.getValidToken(userId);
      const transactions = await this.getTransactions(token, accountId, from, to);

      for (const tx of transactions) {
        const txId = `csas_${tx.transactionId}`;
        const amount = Math.abs(Number(tx.transactionAmount.amount));
        const direction: "credit" | "debit" =
          Number(tx.transactionAmount.amount) >= 0 ? "credit" : "debit";

        await RevolutRepository.upsertTransaction({
          revolutTransactionId: txId,
          userId,
          type: mapCSASTransactionType(tx.bankTransactionCode),
          direction,
          amount,
          currency: tx.transactionAmount.currency,
          description: tx.remittanceInformationUnstructured ?? null,
          counterParty: tx.creditorName || tx.debtorName || null,
          isPending: false,
          transactionDate: tx.bookingDate
            ? new Date(tx.bookingDate)
            : new Date(),
        });
        transactionsSynced++;
      }

      logger.info(
        `CSAS synced ${transactionsSynced} transactions for user ${userId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`CSAS syncTransactions error: ${message}`);
      errors.push(message);
    }

    return { accountsSynced: 0, transactionsSynced, errors };
  }

  private setUserState(
    userId: string,
    partial: Partial<CSASUserState>,
  ): void {
    const existing = this.userStates.get(userId) ?? {
      accessToken: "",
      refreshToken: "",
      expiresAt: 0,
      consentId: "",
    };
    this.userStates.set(userId, { ...existing, ...partial });
  }

  private async getValidToken(userId: string): Promise<string> {
    const state = this.userStates.get(userId);
    if (!state?.accessToken) {
      throw new Error("CSAS not connected — authorize first");
    }

    if (Date.now() / 1000 >= state.expiresAt) {
      const tokens = await this.refreshToken(state.refreshToken);
      this.setUserState(userId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });
      return tokens.accessToken;
    }

    return state.accessToken;
  }
}

function mapCSASAccountType(cashAccountType: string): string {
  const typeMap: Record<string, string> = {
    CACC: "current",
    SVGS: "savings",
    MGLD: "savings",
    OTHR: "other",
    LOAN: "loan",
    CARD: "credit_card",
  };
  return typeMap[cashAccountType] ?? "current";
}

function mapCSASTransactionType(bankTransactionCode: string): string {
  const typeMap: Record<string, string> = {
    PMNT: "transfer",
    NCHG: "card_payment",
    FEE: "fee",
    DCRD: "card_payment",
    DBIT: "transfer",
    CDBT: "transfer",
  };
  return typeMap[bankTransactionCode?.split("-")[0]] ?? "transfer";
}
