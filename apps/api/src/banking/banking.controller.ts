import Elysia, { t } from "elysia";
import { logger } from "@mng/logger/logger";
import { auth } from "../auth";
import { RevolutRepository } from "../revolut/revolut.repository";
import { bankingService } from "./banking.service";

const getSession = async (headers: Record<string, string | undefined>): Promise<{ user: { id: string; name: string; email: string } } | null> => {
  return auth.api.getSession({ headers: new Headers(headers as Record<string, string>) });
};

const app = new Elysia({ prefix: "banking" })

  .get(
    "/connect",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      try {
        const url = await bankingService.getAuthUrl(session.user.id);
        return { url };
      } catch (err) {
        logger.error(`Banking connect failed: ${err}`);
        return { error: "Failed to get auth URL" };
      }
    },
  )

  .post(
    "/callback",
    async ({ body, headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      try {
        await bankingService.handleCallback(session.user.id, body.code);
        return { connected: true };
      } catch (err) {
        logger.error(`Banking callback failed: ${err}`);
        return { error: "Authentication failed" };
      }
    },
    { body: t.Object({ code: t.String() }) },
  )

  .post(
    "/sync",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      const connected = await bankingService.isConnected(session.user.id);
      if (!connected) return { error: "Not connected to banking provider" };

      try {
        const result = await bankingService.syncAll(session.user.id);
        return { synced: result };
      } catch (err) {
        logger.error(`Banking sync failed: ${err}`);
        return { error: "Sync failed" };
      }
    },
  )

  .get(
    "/accounts",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      const accounts = await RevolutRepository.getAccounts(session.user.id);
      return { accounts };
    },
  )

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

  .get(
    "/investments",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { error: "Unauthorized" };

      const investments = await RevolutRepository.getInvestments(session.user.id);
      return { investments };
    },
  )

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

  .get(
    "/status",
    async ({ headers }) => {
      const session = await getSession(headers as Record<string, string>);
      if (!session?.user) return { connected: false };

      const connected = await bankingService.isConnected(session.user.id);
      const provider = bankingService.getProvider();

      return {
        connected,
        provider: provider.name,
        providerType: provider.providerType,
      };
    },
  );

export { app as bankingController };
