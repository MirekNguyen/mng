export interface SyncResult {
  accountsSynced: number;
  transactionsSynced: number;
  errors: string[];
}

export interface BankingProvider {
  readonly name: string;
  readonly providerType: "psd2" | "proprietary";

  getAuthUrl(userId: string, redirectUri: string): Promise<string>;
  handleCallback(userId: string, code: string): Promise<void>;
  isConnected(userId: string): Promise<boolean>;
  disconnect(userId: string): Promise<void>;

  syncAccounts(userId: string): Promise<SyncResult>;
  syncTransactions(userId: string, accountId: string, from?: Date, to?: Date): Promise<SyncResult>;
}
