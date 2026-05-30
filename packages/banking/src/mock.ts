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
import type { BankingProvider } from "./provider.js";
import {
  ACCOUNT_STATUSES,
  BANK_CONNECTION_STATUSES,
  PAYMENT_STATUSES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_STATUSES,
} from "./types.js";

let counter = 0;
function uid(): string {
  counter++;
  return `mock-${String(counter).padStart(4, "0")}`;
}

function today(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const MOCK_INSTITUTIONS: Institution[] = [
  {
    id: "ins_001",
    name: "First National Bank",
    logoUrl: null,
    primaryColor: "#0047AB",
    url: "https://fnb.example.com",
  },
  {
    id: "ins_002",
    name: "Credit Union of America",
    logoUrl: null,
    primaryColor: "#008000",
    url: "https://cua.example.com",
  },
  {
    id: "ins_003",
    name: "Digital Finance Corp",
    logoUrl: null,
    primaryColor: "#6A0DAD",
    url: "https://dfc.example.com",
  },
];

export class MockProvider implements BankingProvider {
  private institutions: Map<string, Institution>;
  private connections: Map<string, BankConnection>;
  private accounts: Map<string, Account>;
  private transactions: Map<string, Transaction>;
  private payments: Map<string, Payment>;

  constructor() {
    this.institutions = new Map(
      MOCK_INSTITUTIONS.map((i) => [i.id, { ...i }]),
    );
    this.connections = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.payments = new Map();
  }

  async getInstitution(institutionId: string): Promise<Institution> {
    const inst = this.institutions.get(institutionId);
    if (!inst) throw new Error(`Institution not found: ${institutionId}`);
    return { ...inst };
  }

  async listInstitutions(): Promise<Institution[]> {
    return [...this.institutions.values()].map((i) => ({ ...i }));
  }

  async createConnection(
    params: ConnectionCreateRequest,
  ): Promise<BankConnection> {
    const inst = this.institutions.get(params.institutionId);
    if (!inst) throw new Error(`Institution not found: ${params.institutionId}`);

    const connection: BankConnection = {
      id: uid(),
      institutionId: params.institutionId,
      name: inst.name,
      status: "connected",
      errorMessage: null,
      lastSyncedAt: null,
      requiresUpdate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.connections.set(connection.id, connection);

    const checkingId = uid();
    const savingsId = uid();

    const checkingAccount: Account = {
      id: checkingId,
      connectionId: connection.id,
      institutionId: params.institutionId,
      name: "Checking",
      officialName: `${inst.name} Interest Checking`,
      type: "checking",
      mask: "6789",
      routingNumber: "021000021",
      accountNumber: null,
      status: "active",
      currency: "USD",
      currentBalanceCents: 125000,
      availableBalanceCents: 120000,
      limitCents: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savingsAccount: Account = {
      id: savingsId,
      connectionId: connection.id,
      institutionId: params.institutionId,
      name: "Savings",
      officialName: `${inst.name} High-Yield Savings`,
      type: "savings",
      mask: "1234",
      routingNumber: "021000021",
      accountNumber: null,
      status: "active",
      currency: "USD",
      currentBalanceCents: 5000000,
      availableBalanceCents: 5000000,
      limitCents: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.set(checkingId, checkingAccount);
    this.accounts.set(savingsId, savingsAccount);

    for (const account of [checkingAccount, savingsAccount]) {
      this.seedTransactions(account.id, connection.id);
    }

    return { ...connection };
  }

  async getConnection(connectionId: string): Promise<BankConnection> {
    const conn = this.connections.get(connectionId);
    if (!conn) throw new Error(`Connection not found: ${connectionId}`);
    return { ...conn };
  }

  async listConnections(): Promise<BankConnection[]> {
    return [...this.connections.values()].map((c) => ({ ...c }));
  }

  async updateConnection(
    connectionId: string,
    _params: Partial<ConnectionCreateRequest>,
  ): Promise<BankConnection> {
    const conn = await this.getConnection(connectionId);
    conn.updatedAt = new Date();
    this.connections.set(connectionId, conn);
    return { ...conn };
  }

  async deleteConnection(connectionId: string): Promise<void> {
    if (!this.connections.has(connectionId)) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    for (const [accId, acc] of this.accounts) {
      if (acc.connectionId === connectionId) {
        for (const [txId, tx] of this.transactions) {
          if (tx.accountId === accId) {
            this.transactions.delete(txId);
          }
        }
        this.accounts.delete(accId);
      }
    }
    this.connections.delete(connectionId);
  }

  async listAccounts(connectionId: string): Promise<Account[]> {
    return [...this.accounts.values()]
      .filter((a) => a.connectionId === connectionId)
      .map((a) => ({ ...a }));
  }

  async getAccount(accountId: string): Promise<Account> {
    const acc = this.accounts.get(accountId);
    if (!acc) throw new Error(`Account not found: ${accountId}`);
    return { ...acc };
  }

  async listTransactions(
    accountId: string,
    filter?: TransactionFilter,
  ): Promise<Transaction[]> {
    let results = [...this.transactions.values()].filter(
      (tx) => tx.accountId === accountId,
    );

    if (filter) {
      if (filter.status) {
        results = results.filter((tx) => tx.status === filter.status);
      }
      if (filter.direction) {
        results = results.filter((tx) => tx.direction === filter.direction);
      }
      if (filter.category) {
        results = results.filter(
          (tx) => tx.category && tx.category.includes(filter.category!),
        );
      }
      if (filter.dateStart) {
        results = results.filter(
          (tx) => tx.transactionDate >= filter.dateStart!,
        );
      }
      if (filter.dateEnd) {
        results = results.filter(
          (tx) => tx.transactionDate <= filter.dateEnd!,
        );
      }
    }

    results.sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime(),
    );

    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 100;
    return results.slice(offset, offset + limit).map((tx) => ({ ...tx }));
  }

  async getTransaction(transactionId: string): Promise<Transaction> {
    const tx = this.transactions.get(transactionId);
    if (!tx) throw new Error(`Transaction not found: ${transactionId}`);
    return { ...tx };
  }

  async getBalance(accountId: string): Promise<Balance> {
    const acc = await this.getAccount(accountId);
    return {
      accountId: acc.id,
      currentCents: acc.currentBalanceCents,
      availableCents: acc.availableBalanceCents,
      limitCents: acc.limitCents,
      currency: acc.currency,
      asOfDate: today(),
    };
  }

  async syncTransactions(connectionId: string): Promise<SyncResult> {
    const conn = await this.getConnection(connectionId);
    let added = 0;

    for (const [, account] of this.accounts) {
      if (account.connectionId !== connectionId) continue;
      const recent = [...this.transactions.values()].filter(
        (tx) => tx.accountId === account.id,
      );
      const newTx = this.generateTransaction(account.id, connectionId);
      if (!recent.some((r) => r.referenceId === newTx.referenceId)) {
        this.transactions.set(newTx.id, newTx);
        added++;
      }
    }

    conn.lastSyncedAt = new Date();
    this.connections.set(connectionId, conn);

    return {
      connectionId,
      accountsSynced: 2,
      transactionsAdded: added,
      transactionsUpdated: 0,
      errors: [],
      syncedAt: new Date(),
    };
  }

  async createPayment(params: CreatePaymentRequest): Promise<Payment> {
    const account = this.accounts.get(params.sourceAccountId);
    if (!account) throw new Error(`Source account not found: ${params.sourceAccountId}`);

    if (account.currentBalanceCents < params.amountCents) {
      throw new Error(
        `Insufficient funds: balance ${account.currentBalanceCents} < requested ${params.amountCents}`,
      );
    }

    account.currentBalanceCents -= params.amountCents;
    if (account.availableBalanceCents !== null) {
      account.availableBalanceCents -= params.amountCents;
    }
    account.updatedAt = new Date();
    this.accounts.set(account.id, account);

    const payment: Payment = {
      id: uid(),
      amountCents: params.amountCents,
      currency: params.currency,
      description: params.description,
      sourceAccountId: params.sourceAccountId,
      recipientId: params.recipientId,
      method: params.method,
      status: "completed",
      referenceId: params.referenceId,
      scheduledDate: params.scheduledDate,
      completedDate: today(),
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.payments.set(payment.id, payment);

    const tx: Transaction = {
      id: uid(),
      accountId: params.sourceAccountId,
      connectionId: account.connectionId,
      description: `Payment: ${params.description}`,
      amountCents: params.amountCents,
      direction: "debit",
      status: "posted",
      category: ["payment", params.method],
      merchantName: null,
      pending: false,
      transactionDate: today(),
      postedDate: today(),
      referenceId: payment.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.set(tx.id, tx);

    return { ...payment };
  }

  reset(): void {
    this.connections.clear();
    this.accounts.clear();
    this.transactions.clear();
    this.payments.clear();
  }

  private seedTransactions(accountId: string, connectionId: string): void {
    const seedData: Array<{
      description: string;
      amountCents: number;
      direction: "debit" | "credit";
      category: string[];
      daysBack: number;
      pending?: boolean;
    }> = [
      { description: "Direct Deposit - Payroll", amountCents: 450000, direction: "credit", category: ["income", "payroll"], daysBack: 1 },
      { description: "Amazon.com Purchase", amountCents: 4230, direction: "debit", category: ["shopping", "online"], daysBack: 2 },
      { description: "Starbucks Coffee", amountCents: 575, direction: "debit", category: ["food", "coffee"], daysBack: 3 },
      { description: "Electric Bill Payment", amountCents: 12450, direction: "debit", category: ["utilities", "electric"], daysBack: 5 },
      { description: "Uber Ride", amountCents: 2340, direction: "debit", category: ["transport", "rideshare"], daysBack: 6 },
      { description: "Transfer to Savings", amountCents: 50000, direction: "debit", category: ["transfer", "savings"], daysBack: 7 },
      { description: "Internet Service", amountCents: 7999, direction: "debit", category: ["utilities", "internet"], daysBack: 10 },
      { description: "Grocery Store - Trader Joe's", amountCents: 8745, direction: "debit", category: ["food", "groceries"], daysBack: 12 },
      { description: "Netflix Subscription", amountCents: 1549, direction: "debit", category: ["entertainment", "subscription"], daysBack: 14 },
      { description: "Interest Payment", amountCents: 123, direction: "credit", category: ["interest", "deposit"], daysBack: 15 },
      { description: "Phone Bill", amountCents: 8599, direction: "debit", category: ["utilities", "phone"], daysBack: 17 },
      { description: "Gas Station - Shell", amountCents: 4560, direction: "debit", category: ["transport", "fuel"], daysBack: 19 },
      { description: "Online Clothing Store", amountCents: 12500, direction: "debit", category: ["shopping", "clothing"], daysBack: 22 },
      { description: "Gym Membership", amountCents: 4999, direction: "debit", category: ["health", "fitness"], daysBack: 25 },
      { description: "Pending Rent Payment", amountCents: 200000, direction: "debit", category: ["housing", "rent"], daysBack: 0, pending: true },
    ];

    for (const item of seedData) {
      const tx: Transaction = {
        id: uid(),
        accountId,
        connectionId,
        description: item.description,
        amountCents: item.amountCents,
        direction: item.direction,
        status: item.pending ? "pending" : "posted",
        category: item.category,
        merchantName: item.category.includes("shopping") ? item.description.split("-")[0]?.trim() ?? null : null,
        pending: item.pending ?? false,
        transactionDate: daysAgo(item.daysBack),
        postedDate: item.pending ? null : daysAgo(Math.max(0, item.daysBack - 1)),
        referenceId: `ext-${uid()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.transactions.set(tx.id, tx);
    }
  }

  private generateTransaction(
    accountId: string,
    connectionId: string,
  ): Transaction {
    const descriptions = [
      "Online Purchase - Target",
      "Coffee Shop",
      "Restaurant Payment",
      "Gas Station",
      "ATM Withdrawal",
    ];
    const desc =
      descriptions[Math.floor(Math.random() * descriptions.length)];

    return {
      id: uid(),
      accountId,
      connectionId,
      description: desc,
      amountCents: Math.floor(Math.random() * 10000) + 100,
      direction: "debit",
      status: "posted",
      category: ["general"],
      merchantName: desc,
      pending: false,
      transactionDate: daysAgo(0),
      postedDate: daysAgo(0),
      referenceId: `ext-${uid()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
