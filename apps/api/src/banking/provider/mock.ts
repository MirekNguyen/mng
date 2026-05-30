import { RevolutRepository } from "../../revolut/revolut.repository";
import { logger } from "@mng/logger/logger";
import type { BankingProvider, SyncResult } from "../types";

const DEMO_USER_ID = "demo-user";

export class MockProvider implements BankingProvider {
  readonly name = "mock";
  readonly providerType = "proprietary" as const;

  async getAuthUrl(userId: string, _redirectUri: string): Promise<string> {
    logger.info(`MockProvider: getAuthUrl for user ${userId}`);
    return `${process.env.API_URL ?? "http://localhost:3000"}/banking/callback?code=mock_code&state=${userId}`;
  }

  async handleCallback(userId: string, _code: string): Promise<void> {
    logger.info(`MockProvider: handleCallback for user ${userId}`);
  }

  async isConnected(userId: string): Promise<boolean> {
    return userId === DEMO_USER_ID;
  }

  async disconnect(userId: string): Promise<void> {
    logger.info(`MockProvider: disconnect for user ${userId}`);
  }

  async syncAccounts(userId: string): Promise<SyncResult> {
    const accounts = [
      { id: "mock_acc_1", name: "Main Account", balance: 8432.5, currency: "CZK", state: "active" },
      { id: "mock_acc_2", name: "Savings", balance: 25000, currency: "CZK", state: "active" },
    ];

    for (const acc of accounts) {
      await RevolutRepository.upsertAccount({
        revolutAccountId: acc.id,
        userId,
        name: acc.name,
        type: "current",
        balance: acc.balance,
        currency: acc.currency,
        isActive: acc.state === "active",
        lastSyncedAt: new Date(),
      });
    }

    logger.info(`MockProvider: synced ${accounts.length} accounts for user ${userId}`);
    return { accountsSynced: accounts.length, transactionsSynced: 0, errors: [] };
  }

  async syncTransactions(
    userId: string,
    _accountId: string,
    _from?: Date,
    _to?: Date,
  ): Promise<SyncResult> {
    logger.info(`MockProvider: syncTransactions for user ${userId}`);
    return { accountsSynced: 0, transactionsSynced: 0, errors: [] };
  }
}
