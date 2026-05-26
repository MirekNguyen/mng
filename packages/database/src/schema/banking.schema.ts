import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

// Revolut OAuth tokens
export const revolutAuth = pgTable("revolut_auth", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiresAt: integer("token_expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const selectRevolutAuthSchema = createSelectSchema(revolutAuth);
export const insertRevolutAuthSchema = createInsertSchema(revolutAuth);
export type RevolutAuth = z.infer<typeof selectRevolutAuthSchema>;
export type CreateRevolutAuth = z.infer<typeof insertRevolutAuthSchema>;

// Bank accounts
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  revolutAccountId: varchar("revolut_account_id", { length: 100 }).notNull().unique(),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "current", "savings", "investment", "crypto"
  balance: numeric("balance", { precision: 20, scale: 4, mode: "number" }).notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  accountNumber: varchar("account_number", { length: 50 }),
  sortCode: varchar("sort_code", { length: 20 }),
  iban: varchar("iban", { length: 50 }),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const selectBankAccountSchema = createSelectSchema(bankAccounts);
export const insertBankAccountSchema = createInsertSchema(bankAccounts);
export type BankAccount = z.infer<typeof selectBankAccountSchema>;
export type CreateBankAccount = z.infer<typeof insertBankAccountSchema>;

// Transactions
export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  revolutTransactionId: varchar("revolut_transaction_id", { length: 100 }).notNull().unique(),
  accountId: integer("account_id").references(() => bankAccounts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "card_payment", "transfer", "topup", "exchange", "refund"
  direction: varchar("direction", { length: 10 }).notNull(), // "debit" or "credit"
  amount: numeric("amount", { precision: 20, scale: 4, mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  fee: numeric("fee", { precision: 20, scale: 4, mode: "number" }).default(0),
  description: text("description"),
  counterParty: varchar("counter_party", { length: 255 }),
  counterPartyAccount: varchar("counter_party_account", { length: 100 }),
  reference: varchar("reference", { length: 255 }),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  merchantName: varchar("merchant_name", { length: 255 }),
  merchantCity: varchar("merchant_city", { length: 100 }),
  merchantCountry: varchar("merchant_country", { length: 100 }),
  merchantCategoryCode: varchar("merchant_category_code", { length: 10 }),
  tags: text("tags").array(),
  notes: text("notes"),
  balanceBefore: numeric("balance_before", { precision: 20, scale: 4, mode: "number" }),
  balanceAfter: numeric("balance_after", { precision: 20, scale: 4, mode: "number" }),
  transactionDate: timestamp("transaction_date").notNull(),
  settledDate: timestamp("settled_date"),
  isPending: boolean("is_pending").default(false),
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const selectBankTransactionSchema = createSelectSchema(bankTransactions);
export const insertBankTransactionSchema = createInsertSchema(bankTransactions);
export type BankTransaction = z.infer<typeof selectBankTransactionSchema>;
export type CreateBankTransaction = z.infer<typeof insertBankTransactionSchema>;

// Investment accounts / portfolios
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  revolutInvestmentId: varchar("revolut_investment_id", { length: 100 }).notNull().unique(),
  userId: text("user_id").notNull(),
  ticker: varchar("ticker", { length: 20 }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "stock", "etf", "crypto", "commodity"
  quantity: numeric("quantity", { precision: 20, scale: 8, mode: "number" }).notNull().default(0),
  averageBuyPrice: numeric("average_buy_price", { precision: 20, scale: 4, mode: "number" }),
  currentPrice: numeric("current_price", { precision: 20, scale: 4, mode: "number" }),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  totalCost: numeric("total_cost", { precision: 20, scale: 4, mode: "number" }),
  totalValue: numeric("total_value", { precision: 20, scale: 4, mode: "number" }),
  pl: numeric("pl", { precision: 20, scale: 4, mode: "number" }), // profit/loss
  plPercent: doublePrecision("pl_percent"),
  exchangeCode: varchar("exchange_code", { length: 20 }), // "LSE", "NASDAQ", etc.
  isActive: boolean("is_active").default(true),
  lastPriceUpdatedAt: timestamp("last_price_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const selectInvestmentSchema = createSelectSchema(investments);
export const insertInvestmentSchema = createInsertSchema(investments);
export type Investment = z.infer<typeof selectInvestmentSchema>;
export type CreateInvestment = z.infer<typeof insertInvestmentSchema>;

// Investment transactions (buy/sell history)
export const investmentTransactions = pgTable("investment_transactions", {
  id: serial("id").primaryKey(),
  revolutOrderId: varchar("revolut_order_id", { length: 100 }).notNull().unique(),
  investmentId: integer("investment_id").references(() => investments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "buy", "sell"
  quantity: numeric("quantity", { precision: 20, scale: 8, mode: "number" }).notNull(),
  price: numeric("price", { precision: 20, scale: 4, mode: "number" }).notNull(),
  total: numeric("total", { precision: 20, scale: 4, mode: "number" }).notNull(),
  fee: numeric("fee", { precision: 20, scale: 4, mode: "number" }).default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  status: varchar("status", { length: 20 }).notNull().default("executed"), // "pending", "executed", "failed"
  executedAt: timestamp("executed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const selectInvestmentTransactionSchema = createSelectSchema(investmentTransactions);
export const insertInvestmentTransactionSchema = createInsertSchema(investmentTransactions);
export type InvestmentTransaction = z.infer<typeof selectInvestmentTransactionSchema>;
export type CreateInvestmentTransaction = z.infer<typeof insertInvestmentTransactionSchema>;

// Spending categories & budgets
export const spendingCategories = pgTable("spending_categories", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  budget: numeric("budget", { precision: 20, scale: 4, mode: "number", default: 0 }),
  period: varchar("period", { length: 20 }).default("monthly"), // "weekly", "monthly", "yearly"
  isSystem: boolean("is_system").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const selectSpendingCategorySchema = createSelectSchema(spendingCategories);
export const insertSpendingCategorySchema = createInsertSchema(spendingCategories);
export type SpendingCategory = z.infer<typeof selectSpendingCategorySchema>;
export type CreateSpendingCategory = z.infer<typeof insertSpendingCategorySchema>;

// Relations
export const bankAccountsRelations = relations(bankAccounts, ({ many }) => ({
  transactions: many(bankTransactions),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  account: one(bankAccounts, {
    fields: [bankTransactions.accountId],
    references: [bankAccounts.id],
  }),
}));

export const investmentsRelations = relations(investments, ({ many }) => ({
  transactions: many(investmentTransactions),
}));

export const investmentTransactionsRelations = relations(investmentTransactions, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentTransactions.investmentId],
    references: [investments.id],
  }),
}));

export const bankingSchema = {
  revolutAuth,
  bankAccounts,
  bankTransactions,
  investments,
  investmentTransactions,
  spendingCategories,
  bankAccountsRelations,
  bankTransactionsRelations,
  investmentsRelations,
  investmentTransactionsRelations,
};
