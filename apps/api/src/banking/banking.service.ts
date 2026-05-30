import { getBankingProvider } from "./registry";
import type { BankingProvider, SyncResult } from "./types";
import { logger } from "@mng/logger/logger";

const syncTimestamps = new Map<string, number>();
const SYNC_COOLDOWN_MS = 10_000;

function getRedirectUri(): string {
  return `${process.env.API_URL ?? "http://localhost:3000"}/banking/callback`;
}

export const bankingService = {
  getProvider(): BankingProvider {
    return getBankingProvider();
  },

  async getAuthUrl(userId: string): Promise<string> {
    const provider = this.getProvider();
    return provider.getAuthUrl(userId, getRedirectUri());
  },

  async handleCallback(userId: string, code: string): Promise<void> {
    const provider = this.getProvider();
    return provider.handleCallback(userId, code);
  },

  async isConnected(userId: string): Promise<boolean> {
    const provider = this.getProvider();
    return provider.isConnected(userId);
  },

  async disconnect(userId: string): Promise<void> {
    const provider = this.getProvider();
    return provider.disconnect(userId);
  },

  async syncAll(userId: string): Promise<SyncResult> {
    const now = Date.now();
    const lastSync = syncTimestamps.get(userId) ?? 0;

    if (now - lastSync < SYNC_COOLDOWN_MS) {
      const waitMs = SYNC_COOLDOWN_MS - (now - lastSync);
      logger.warn(`Sync rate limited for user ${userId}`);
      return {
        accountsSynced: 0,
        transactionsSynced: 0,
        errors: [`Rate limited. Try again in ${Math.ceil(waitMs / 1000)}s.`],
      };
    }

    syncTimestamps.set(userId, now);

    const provider = this.getProvider();
    logger.info(`Starting sync for user ${userId} via ${provider.name}`);

    const accountsResult = await provider.syncAccounts(userId);
    return accountsResult;
  },

  async syncTransactions(
    userId: string,
    accountId: string,
    from?: Date,
    to?: Date,
  ): Promise<SyncResult> {
    const provider = this.getProvider();
    return provider.syncTransactions(userId, accountId, from, to);
  },
};
