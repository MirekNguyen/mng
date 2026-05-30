export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "credit_card",
  "money_market",
  "cd",
  "loan",
  "investment",
  "other",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_STATUSES = [
  "active",
  "inactive",
  "closed",
  "frozen",
  "pending",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const TRANSACTION_STATUSES = [
  "pending",
  "posted",
  "returned",
  "cancelled",
  "voided",
] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_DIRECTIONS = ["debit", "credit"] as const;
export type TransactionDirection = (typeof TRANSACTION_DIRECTIONS)[number];

export const BANK_CONNECTION_STATUSES = [
  "connected",
  "disconnected",
  "expired",
  "error",
  "pending",
] as const;
export type BankConnectionStatus = (typeof BANK_CONNECTION_STATUSES)[number];

export const PAYMENT_METHOD_TYPES = [
  "ach",
  "wire",
  "check",
  "card",
  "internal",
  "other",
] as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "returned",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Institution {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  url: string | null;
}

export interface Account {
  id: string;
  connectionId: string;
  institutionId: string;
  name: string;
  officialName: string | null;
  type: AccountType;
  mask: string | null;
  routingNumber: string | null;
  accountNumber: string | null;
  status: AccountStatus;
  currency: string;
  currentBalanceCents: number;
  availableBalanceCents: number | null;
  limitCents: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  connectionId: string;
  description: string;
  amountCents: number;
  direction: TransactionDirection;
  status: TransactionStatus;
  category: string[] | null;
  merchantName: string | null;
  pending: boolean;
  transactionDate: string;
  postedDate: string | null;
  referenceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Balance {
  accountId: string;
  currentCents: number;
  availableCents: number | null;
  limitCents: number | null;
  currency: string;
  asOfDate: string;
}

export interface BankConnection {
  id: string;
  institutionId: string;
  name: string;
  status: BankConnectionStatus;
  errorMessage: string | null;
  lastSyncedAt: Date | null;
  requiresUpdate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRecipient {
  id: string;
  name: string;
  routingNumber: string;
  accountNumber: string;
  accountType: AccountType;
  bankName: string | null;
  email: string | null;
  createdAt: Date;
}

export interface CreatePaymentRequest {
  amountCents: number;
  currency: string;
  description: string;
  sourceAccountId: string;
  recipientId: string;
  method: PaymentMethodType;
  referenceId: string | null;
  scheduledDate: string | null;
}

export interface Payment {
  id: string;
  amountCents: number;
  currency: string;
  description: string;
  sourceAccountId: string;
  recipientId: string;
  method: PaymentMethodType;
  status: PaymentStatus;
  referenceId: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  connectionId: string;
  accountsSynced: number;
  transactionsAdded: number;
  transactionsUpdated: number;
  errors: string[];
  syncedAt: Date;
}

export interface TransactionFilter {
  accountId?: string;
  connectionId?: string;
  status?: TransactionStatus;
  direction?: TransactionDirection;
  category?: string;
  dateStart?: string;
  dateEnd?: string;
  offset?: number;
  limit?: number;
}

export interface ConnectionCreateRequest {
  institutionId: string;
  username?: string;
  publicToken?: string;
  accessToken?: string;
}
