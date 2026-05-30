import { RevolutService } from "../../revolut/revolut.service";
import { RevolutRepository } from "../../revolut/revolut.repository";
import { logger } from "@mng/logger/logger";
import type { BankingProvider, SyncResult } from "../types";

const REVOLUT_CLIENT_ID = process.env.REVOLUT_CLIENT_ID!;
const REVOLUT_CLIENT_SECRET = process.env.REVOLUT_CLIENT_SECRET!;
const API_URL = process.env.API_URL ?? "http://localhost:3000";

export class RevolutProvider implements BankingProvider {
  readonly name = "revolut";
  readonly providerType = "proprietary" as const;

  async getAuthUrl(userId: string, redirectUri: string): Promise<string> {
    return RevolutService.getAuthUrl(
      { clientId: REVOLUT_CLIENT_ID, clientSecret: REVOLUT_CLIENT_SECRET },
      redirectUri,
    );
  }

  async handleCallback(userId: string, code: string): Promise<void> {
    const service = new RevolutService({
      clientId: REVOLUT_CLIENT_ID,
      clientSecret: REVOLUT_CLIENT_SECRET,
    });
    const redirectUri = `${API_URL}/banking/callback`;
    const tokens = await service.exchangeCode(code, redirectUri);
    await RevolutRepository.upsertAuth({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    });
    logger.info(`Revolut connected for user ${userId}`);
  }

  async isConnected(userId: string): Promise<boolean> {
    const auth = await RevolutRepository.getAuth(userId);
    return !!auth;
  }

  async disconnect(userId: string): Promise<void> {
    await RevolutRepository.deleteAuth(userId);
    logger.info(`Revolut disconnected for user ${userId}`);
  }

  async syncAccounts(userId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let accountsSynced = 0;

    try {
      const authData = await this.requireAuth(userId);
      const service = this.makeAuthService(authData);
      const accounts = await service.getAccounts();

      for (const acc of accounts) {
        await RevolutRepository.upsertAccount({
          revolutAccountId: acc.id,
          userId,
          name: acc.name,
          type: "current",
          balance: acc.balance,
          currency: acc.currency,
          accountNumber: acc.accountNumber ?? null,
          sortCode: acc.sortCode ?? null,
          iban: acc.iban ?? null,
          isActive: acc.state === "active",
          lastSyncedAt: new Date(),
        });
        accountsSynced++;
      }

      logger.info(`Revolut synced ${accountsSynced} accounts for user ${userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Revolut syncAccounts error: ${message}`);
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
      const authData = await this.requireAuth(userId);
      const service = this.makeAuthService(authData);

      const fromStr = from?.toISOString();
      const toStr = to?.toISOString();
      const transactions = await service.getTransactions(accountId, fromStr, toStr);

      for (const tx of transactions) {
        await RevolutRepository.upsertTransaction({
          revolutTransactionId: tx.id,
          userId,
          type: tx.type,
          direction: tx.amount >= 0 ? "credit" : "debit",
          amount: Math.abs(tx.amount),
          currency: tx.currency,
          description: tx.description ?? null,
          counterParty: tx.counterparty ?? null,
          category: tx.merchant?.category_code ?? null,
          merchantName: tx.merchant?.name ?? null,
          merchantCity: tx.merchant?.city ?? null,
          merchantCountry: tx.merchant?.country ?? null,
          merchantCategoryCode: tx.merchant?.category_code ?? null,
          isPending: tx.state === "pending",
          transactionDate: new Date(tx.created_at),
          settledDate: tx.state === "completed" ? new Date(tx.updated_at) : null,
        });
        transactionsSynced++;
      }

      logger.info(
        `Revolut synced ${transactionsSynced} transactions for user ${userId} on account ${accountId}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Revolut syncTransactions error: ${message}`);
      errors.push(message);
    }

    return { accountsSynced: 0, transactionsSynced, errors };
  }

  private async requireAuth(userId: string): Promise<{ accessToken: string; refreshToken: string; tokenExpiresAt: number }> {
    const auth = await RevolutRepository.getAuth(userId);
    if (!auth) throw new Error("Revolut not connected for this user");
    return auth;
  }

  private makeAuthService(auth: { accessToken: string; tokenExpiresAt: number }): RevolutService {
    return new RevolutService(
      { clientId: REVOLUT_CLIENT_ID, clientSecret: REVOLUT_CLIENT_SECRET },
      auth.accessToken,
      auth.tokenExpiresAt,
    );
  }
}
