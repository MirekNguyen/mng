import { db, eq, and, desc, sql, gte, lte } from "@mng/database/db";
import {
  revolutAuth,
  bankAccounts,
  bankTransactions,
  investments,
  investmentTransactions,
  spendingCategories,
} from "@mng/database/schema/banking.schema";
import type {
  RevolutAuth,
  CreateRevolutAuth,
  BankAccount,
  CreateBankAccount,
  BankTransaction,
  CreateBankTransaction,
  Investment,
  CreateInvestment,
  InvestmentTransaction,
  SpendingCategory,
} from "@mng/database/schema/banking.schema";

export const RevolutRepository = {
  // Auth
  async getAuth(userId: string): Promise<RevolutAuth | undefined> {
    return db.query.revolutAuth.findFirst({
      where: eq(revolutAuth.userId, userId),
    });
  },

  async upsertAuth(data: Omit<CreateRevolutAuth, "id" | "createdAt" | "updatedAt">): Promise<RevolutAuth> {
    const [result] = await db
      .insert(revolutAuth)
      .values(data)
      .onConflictDoUpdate({
        target: revolutAuth.userId,
        set: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          tokenExpiresAt: data.tokenExpiresAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  },

  async deleteAuth(userId: string): Promise<void> {
    await db.delete(revolutAuth).where(eq(revolutAuth.userId, userId));
  },

  // Accounts
  async getAccounts(userId: string): Promise<BankAccount[]> {
    return db.query.bankAccounts.findMany({
      where: and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)),
      orderBy: (a, { asc }) => [asc(a.name)],
    });
  },

  async upsertAccount(data: Omit<CreateBankAccount, "id" | "createdAt" | "updatedAt">): Promise<BankAccount> {
    const [result] = await db
      .insert(bankAccounts)
      .values(data)
      .onConflictDoUpdate({
        target: bankAccounts.revolutAccountId,
        set: {
          name: data.name,
          type: data.type,
          balance: data.balance,
          currency: data.currency,
          accountNumber: data.accountNumber,
          sortCode: data.sortCode,
          iban: data.iban,
          isActive: data.isActive,
          lastSyncedAt: data.lastSyncedAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  },

  async updateAccountBalance(id: number, balance: number): Promise<void> {
    await db
      .update(bankAccounts)
      .set({ balance, lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(bankAccounts.id, id));
  },

  // Transactions
  async getTransactions(
    userId: string,
    options: { limit?: number; offset?: number; category?: string; direction?: string; from?: Date; to?: Date } = {},
  ): Promise<BankTransaction[]> {
    const conditions = [eq(bankTransactions.userId, userId)];
    if (options.category) conditions.push(eq(bankTransactions.category, options.category));
    if (options.direction) conditions.push(eq(bankTransactions.direction, options.direction));
    if (options.from) conditions.push(gte(bankTransactions.transactionDate, options.from));
    if (options.to) conditions.push(lte(bankTransactions.transactionDate, options.to));

    return db.query.bankTransactions.findMany({
      where: and(...conditions),
      orderBy: (t, { desc }) => [desc(t.transactionDate)],
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
  },

  async upsertTransaction(data: Omit<CreateBankTransaction, "id" | "createdAt" | "updatedAt">): Promise<BankTransaction> {
    const [result] = await db
      .insert(bankTransactions)
      .values(data)
      .onConflictDoUpdate({
        target: bankTransactions.revolutTransactionId,
        set: {
          type: data.type,
          direction: data.direction,
          amount: data.amount,
          fee: data.fee,
          description: data.description,
          counterParty: data.counterParty,
          category: data.category,
          merchantName: data.merchantName,
          merchantCity: data.merchantCity,
          merchantCountry: data.merchantCountry,
          merchantCategoryCode: data.merchantCategoryCode,
          tags: data.tags,
          isPending: data.isPending,
          isRecurring: data.isRecurring,
          settledDate: data.settledDate,
          balanceBefore: data.balanceBefore,
          balanceAfter: data.balanceAfter,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  },

  // Spending summary
  async getSpendingSummary(userId: string, from: Date, to: Date) {
    return db
      .select({
        category: bankTransactions.category,
        total: sql<number>`sum(${bankTransactions.amount})`,
        count: sql<number>`count(*)`,
        currency: bankTransactions.currency,
      })
      .from(bankTransactions)
      .where(
        and(
          eq(bankTransactions.userId, userId),
          eq(bankTransactions.direction, "debit"),
          gte(bankTransactions.transactionDate, from),
          lte(bankTransactions.transactionDate, to),
        ),
      )
      .groupBy(bankTransactions.category, bankTransactions.currency);
  },

  // Investments
  async getInvestments(userId: string): Promise<Investment[]> {
    return db.query.investments.findMany({
      where: and(eq(investments.userId, userId), eq(investments.isActive, true)),
    });
  },

  async upsertInvestment(data: Omit<CreateInvestment, "id" | "createdAt" | "updatedAt">): Promise<Investment> {
    const [result] = await db
      .insert(investments)
      .values(data)
      .onConflictDoUpdate({
        target: investments.revolutInvestmentId,
        set: {
          quantity: data.quantity,
          currentPrice: data.currentPrice,
          totalValue: data.totalValue,
          pl: data.pl,
          plPercent: data.plPercent,
          isActive: data.isActive,
          lastPriceUpdatedAt: data.lastPriceUpdatedAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  },

  // Categories
  async getCategories(userId: string): Promise<SpendingCategory[]> {
    return db.query.spendingCategories.findMany({
      where: (c, { or, eq, isNull }) => or(eq(c.userId, userId), sql`${c.userId} IS NULL`),
      orderBy: (c, { asc }) => [asc(c.sortOrder)],
    });
  },

  async upsertCategory(data: Omit<CreateSpendingCategory, "id" | "createdAt">): Promise<SpendingCategory> {
    const [result] = await db.insert(spendingCategories).values(data).onConflictDoNothing().returning();
    return result;
  },
};
