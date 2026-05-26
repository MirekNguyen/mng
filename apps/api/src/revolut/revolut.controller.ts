import Elysia, { t } from "elysia";
import { logger } from "@mng/logger/logger";
import { auth } from "../auth";
import { RevolutRepository } from "./revolut.repository";
import {
  RevolutService,
  DEMO_ACCOUNTS,
  DEMO_TRANSACTIONS,
  DEMO_POSITIONS,
  DEMO_SPENDING_CATEGORIES,
} from "./revolut.service";

const REVOLUT_CLIENT_ID = process.env.REVOLUT_CLIENT_ID!;
const REVOLUT_CLIENT_SECRET = process.env.REVOLUT_CLIENT_SECRET!;
const API_URL = process.env.API_URL ?? "http://localhost:3000";

const getSession = async (headers: Record<string, string | undefined>) => {
  return auth.api.getSession({ headers: new Headers(headers as Record<string, string>) });
};

const app = new Elysia({ prefix: "revolut" })

  // Get auth URL for OAuth flow
  .get(
    "/auth-url",
    async () => {
      const redirectUri = `${API_URL}/revolut/callback`;
      const url = RevolutService.getAuthUrl(
        { clientId: REVOLUT_CLIENT_ID, clientSecret: REVOLUT_CLIENT_SECRET },
        redirectUri,
      );
      return { url };
    },
  )

  // OAuth callback — exchange code for tokens
  .post(
    "/auth",
    async ({ body, headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      try {
        const service = new RevolutService({
          clientId: REVOLUT_CLIENT_ID,
          clientSecret: REVOLUT_CLIENT_SECRET,
        });

        const redirectUri = `${API_URL}/revolut/callback`;
        const tokens = await service.exchangeCode(body.code, redirectUri);

        await RevolutRepository.upsertAuth({
          userId: session.user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
        });

        return { connected: true };
      } catch (err) {
        logger.error(`Revolut auth failed: ${err}`);
        return { error: "Authentication failed" };
      }
    },
    { body: t.Object({ code: t.String() }) },
  )

  // Sync all data from Revolut
  .post(
    "/sync",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      const authData = await RevolutRepository.getAuth(session.user.id);
      if (!authData) return { error: "Not connected to Revolut" };

      try {
        const service = new RevolutService(
          { clientId: REVOLUT_CLIENT_ID, clientSecret: REVOLUT_CLIENT_SECRET },
          authData.accessToken,
          authData.tokenExpiresAt,
        );

        // Sync accounts
        const remoteAccounts = await service.getAccounts();
        for (const acc of remoteAccounts) {
          await RevolutRepository.upsertAccount({
            revolutAccountId: acc.id,
            userId: session.user.id,
            name: acc.name,
            type: "current",
            balance: acc.balance,
            currency: acc.currency,
            accountNumber: acc.accountNumber,
            sortCode: acc.sortCode,
            iban: acc.iban,
            isActive: acc.state === "active",
            lastSyncedAt: new Date(),
          });
        }

        // Sync transactions for each account
        let totalTx = 0;
        for (const acc of remoteAccounts.slice(0, 2)) {
          const txs = await service.getTransactions(acc.id);
          for (const tx of txs) {
            await RevolutRepository.upsertTransaction({
              revolutTransactionId: tx.id,
              userId: session.user.id,
              type: tx.type,
              direction: tx.amount >= 0 ? "credit" : "debit",
              amount: Math.abs(tx.amount),
              currency: tx.currency,
              description: tx.description,
              counterParty: tx.counterparty,
              category: tx.merchant?.category_code,
              merchantName: tx.merchant?.name,
              merchantCity: tx.merchant?.city,
              merchantCountry: tx.merchant?.country,
              merchantCategoryCode: tx.merchant?.category_code,
              isPending: tx.state === "pending",
              transactionDate: new Date(tx.created_at),
              settledDate: tx.state === "completed" ? new Date(tx.updated_at) : null,
            });
            totalTx++;
          }
        }

        // Sync investment positions
        try {
          const positions = await service.getPositions();
          for (const pos of positions) {
            await RevolutRepository.upsertInvestment({
              revolutInvestmentId: pos.id,
              userId: session.user.id,
              ticker: pos.ticker,
              name: pos.name,
              type: pos.type,
              quantity: pos.quantity,
              averageBuyPrice: pos.average_buy_price,
              currentPrice: pos.current_price,
              currency: pos.currency,
              totalCost: pos.total_cost,
              totalValue: pos.total_value,
              pl: pos.pl,
              plPercent: pos.pl_percent,
              isActive: true,
              lastPriceUpdatedAt: new Date(),
            });
          }
        } catch {
          logger.info("Investment sync not available or no positions");
        }

        return { synced: { accounts: remoteAccounts.length, transactions: totalTx } };
      } catch (err) {
        logger.error(`Revolut sync failed: ${err}`);
        // If token expired, try refresh
        if (String(err).includes("401") || String(err).includes("token")) {
          try {
            const service = new RevolutService({
              clientId: REVOLUT_CLIENT_ID,
              clientSecret: REVOLUT_CLIENT_SECRET,
            });
            const tokens = await service.refreshAccessToken(authData.refreshToken);
            await RevolutRepository.upsertAuth({
              userId: session.user.id,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              tokenExpiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
            });
            return { error: "Token expired. Please try syncing again." };
          } catch {
            return { error: "Sync failed and token refresh also failed" };
          }
        }
        return { error: "Sync failed" };
      }
    },
  )

  // Load demo data (for development without real API keys)
  .post(
    "/load-demo",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      for (const acc of DEMO_ACCOUNTS) {
        const typeMap: Record<string, string> = {
          "Main Account": "current",
          Savings: "savings",
          "Investment Account": "investment",
          Crypto: "crypto",
        };
        await RevolutRepository.upsertAccount({
          revolutAccountId: acc.id,
          userId: session.user.id,
          name: acc.name,
          type: typeMap[acc.name] ?? "current",
          balance: acc.balance,
          currency: acc.currency,
          accountNumber: acc.accountNumber,
          sortCode: acc.sortCode,
          iban: acc.iban,
          isActive: acc.state === "active",
          lastSyncedAt: new Date(),
        });
      }

      for (const tx of DEMO_TRANSACTIONS) {
        await RevolutRepository.upsertTransaction({
          revolutTransactionId: tx.id,
          userId: session.user.id,
          type: tx.type,
          direction: tx.amount >= 0 ? "credit" : "debit",
          amount: Math.abs(tx.amount),
          currency: tx.currency,
          description: tx.description,
          counterParty: tx.counterparty,
          merchantName: tx.merchant?.name,
          merchantCity: tx.merchant?.city,
          merchantCountry: tx.merchant?.country,
          merchantCategoryCode: tx.merchant?.category_code,
          category: mapMerchantToCategory(tx.merchant?.category_code ?? tx.type),
          isPending: tx.state === "pending",
          transactionDate: new Date(tx.created_at),
          settledDate: tx.state === "completed" ? new Date(tx.updated_at) : null,
        });
      }

      for (const pos of DEMO_POSITIONS) {
        await RevolutRepository.upsertInvestment({
          revolutInvestmentId: pos.id,
          userId: session.user.id,
          ticker: pos.ticker,
          name: pos.name,
          type: pos.type,
          quantity: pos.quantity,
          averageBuyPrice: pos.average_buy_price,
          currentPrice: pos.current_price,
          currency: pos.currency,
          totalCost: pos.total_cost,
          totalValue: pos.total_value,
          pl: pos.pl,
          plPercent: pos.pl_percent,
          isActive: true,
          lastPriceUpdatedAt: new Date(),
        });
      }

      for (const cat of DEMO_SPENDING_CATEGORIES) {
        await RevolutRepository.upsertCategory({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          budget: cat.budget,
          period: "monthly",
          isSystem: true,
          sortOrder: 0,
        });
      }

      return { success: true, accounts: DEMO_ACCOUNTS.length, transactions: DEMO_TRANSACTIONS.length, investments: DEMO_POSITIONS.length };
    },
  )

  // Get accounts
  .get(
    "/accounts",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      const accounts = await RevolutRepository.getAccounts(session.user.id);
      return { accounts };
    },
  )

  // Get transactions with optional filters
  .get(
    "/transactions",
    async ({ headers, query }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;

      const transactions = await RevolutRepository.getTransactions(session.user.id, {
        limit: Number(query.limit ?? 50),
        offset: Number(query.offset ?? 0),
        category: query.category,
        direction: query.direction,
        from,
        to,
      });

      return { transactions };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        category: t.Optional(t.String()),
        direction: t.Optional(t.String()),
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    },
  )

  // Get investments/portfolio
  .get(
    "/investments",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      const investments = await RevolutRepository.getInvestments(session.user.id);
      return { investments };
    },
  )

  // Get spending summary
  .get(
    "/spending",
    async ({ headers, query }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      const now = new Date();
      const from = query.from ? new Date(query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
      const to = query.to ? new Date(query.to) : now;

      const categories = await RevolutRepository.getCategories(session.user.id);
      const spending = await RevolutRepository.getSpendingSummary(session.user.id, from, to);

      // Merge categories with spending data
      const categoryMap = new Map(spending.map((s) => [s.category ?? "other", s]));
      const merged = categories.map((cat) => ({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget: cat.budget,
        spent: Number(categoryMap.get(cat.name)?.total ?? 0),
        count: Number(categoryMap.get(cat.name)?.count ?? 0),
      }));

      return { categories: merged, from, to };
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    },
  )

  // Check connection status
  .get(
    "/status",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { connected: false };

      const authData = await RevolutRepository.getAuth(session.user.id);
      return {
        connected: !!authData,
        hasDemoData: false, // Will be checked separately
      };
    },
  );

// Helper to map merchant category codes to spending categories
const mapMerchantToCategory = (code: string): string => {
  const categoryMap: Record<string, string> = {
    "5411": "Groceries",
    "5812": "Dining Out",
    "5813": "Dining Out",
    "5815": "Entertainment",
    "4111": "Transport",
    "4121": "Transport",
    "4131": "Transport",
    "4814": "Bills & Utilities",
    "4899": "Bills & Utilities",
    "4900": "Bills & Utilities",
    "5311": "Shopping",
    "5310": "Shopping",
    "5651": "Shopping",
    "5691": "Shopping",
    "5941": "Shopping",
    "7999": "Health & Fitness",
    "7298": "Health & Fitness",
    "5047": "Health & Fitness",
    "card_payment": "Shopping",
    "transfer": "Transfers",
    "topup": "Income",
    "refund": "Other",
  };
  return categoryMap[code] ?? "Other";
};

export { app as revolutController };
