import type {
  Account,
  Balance,
  BankConnection,
  ConnectionCreateRequest,
  CreatePaymentRequest,
  Institution,
  Payment,
  SyncResult,
  Transaction,
  TransactionFilter,
} from "./types.js";

export interface BankingProvider {
  getInstitution(institutionId: string): Promise<Institution>;
  listInstitutions(): Promise<Institution[]>;

  createConnection(params: ConnectionCreateRequest): Promise<BankConnection>;
  getConnection(connectionId: string): Promise<BankConnection>;
  listConnections(): Promise<BankConnection[]>;
  updateConnection(
    connectionId: string,
    params: Partial<ConnectionCreateRequest>,
  ): Promise<BankConnection>;
  deleteConnection(connectionId: string): Promise<void>;

  listAccounts(connectionId: string): Promise<Account[]>;
  getAccount(accountId: string): Promise<Account>;

  listTransactions(
    accountId: string,
    filter?: TransactionFilter,
  ): Promise<Transaction[]>;
  getTransaction(transactionId: string): Promise<Transaction>;

  getBalance(accountId: string): Promise<Balance>;

  syncTransactions(connectionId: string): Promise<SyncResult>;

  createPayment(params: CreatePaymentRequest): Promise<Payment>;
}
