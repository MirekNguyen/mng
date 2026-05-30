import { logger } from "@mng/logger/logger";
import { RevolutRepository } from "../../revolut/revolut.repository";

const FIO_API_BASE = "https://fioapi.fio.cz/ib_api/rest/";

export interface BankingProviderSync {
  syncAccounts(userId: string): Promise<{ accountsSynced: number }>;
  syncTransactions(
    userId: string,
    accountId: string,
    from?: string,
    to?: string,
  ): Promise<{ transactionsSynced: number }>;
  syncInvestments(): Promise<{ accountsSynced: number; transactionsSynced: number }>;
}

interface FioColumn {
  id: number;
  va: string;
}

interface FioStatementResponse {
  accountStatement: {
    info: {
      accountId: number | string;
      bankCode: string;
      currency: string;
      closingBalance: number;
      [key: string]: unknown;
    };
    transactionList: {
      transaction: Record<string, FioColumn>[];
    };
  };
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export class FioProvider implements BankingProviderSync {
  private token: string;

  constructor() {
    this.token = process.env.FIO_API_TOKEN ?? "";
  }

  async syncAccounts(userId: string): Promise<{ accountsSynced: number }> {
    if (!this.token) {
      logger.error("FIO_API_TOKEN not configured");
      return { accountsSynced: 0 };
    }

    try {
      const today = new Date();
      const from = formatDate(daysAgo(30));
      const to = formatDate(today);

      const data = await this.fetchStatement(from, to);
      if (!data?.accountStatement?.info) {
        logger.error("Fio API returned unexpected response structure");
        return { accountsSynced: 0 };
      }

      const info = data.accountStatement.info;
      const accountId = String(info.accountId);
      const fioAccountId = `fio_${accountId}`;

      await RevolutRepository.upsertAccount({
        revolutAccountId: fioAccountId,
        userId,
        name: `Fio Account ${accountId}`,
        type: "current",
        balance: Number(info.closingBalance),
        currency: info.currency ?? "CZK",
        accountNumber: accountId,
        sortCode: info.bankCode,
        isActive: true,
        lastSyncedAt: new Date(),
      });

      return { accountsSynced: 1 };
    } catch (error) {
      logger.error(`Fio syncAccounts error: ${error}`);
      return { accountsSynced: 0 };
    }
  }

  async syncTransactions(
    userId: string,
    accountId: string,
    from?: string,
    to?: string,
  ): Promise<{ transactionsSynced: number }> {
    if (!this.token) {
      logger.error("FIO_API_TOKEN not configured");
      return { transactionsSynced: 0 };
    }

    try {
      const fromDate = from ?? formatDate(daysAgo(90));
      const toDate = to ?? formatDate(new Date());

      const data = await this.fetchStatement(fromDate, toDate);
      if (!data?.accountStatement?.transactionList?.transaction) {
        return { transactionsSynced: 0 };
      }

      const currency = data.accountStatement.info.currency ?? "CZK";
      const rawTransactions = data.accountStatement.transactionList.transaction;
      let synced = 0;

      for (const tx of rawTransactions) {
        const fioTxId = `fio_${tx.column22?.id ?? ""}`;
        if (!tx.column22?.id) continue;

        const amount = Math.abs(Number(tx.column0?.va ?? 0));
        const direction: "credit" | "debit" =
          Number(tx.column0?.va) >= 0 ? "credit" : "debit";

        const transactionDate = tx.column10?.va
          ? new Date(tx.column10.va)
          : new Date();

        await RevolutRepository.upsertTransaction({
          revolutTransactionId: fioTxId,
          userId,
          type: "transfer",
          direction,
          amount,
          currency: tx.column14?.va ?? currency,
          description: tx.column4?.va ?? null,
          counterParty: tx.column2?.va ?? null,
          counterPartyAccount: tx.column1?.va ?? null,
          reference: tx.column5?.va ?? null,
          isPending: false,
          transactionDate,
        });
        synced++;
      }

      return { transactionsSynced: synced };
    } catch (error) {
      logger.error(`Fio syncTransactions error: ${error}`);
      return { transactionsSynced: 0 };
    }
  }

  async syncInvestments(): Promise<{ accountsSynced: number; transactionsSynced: number }> {
    logger.info("Fio API does not support investments");
    return { accountsSynced: 0, transactionsSynced: 0 };
  }

  private async fetchStatement(from: string, to: string): Promise<FioStatementResponse | null> {
    const url = `${FIO_API_BASE}periode/${this.token}/${from}/${to}/transactions.json`;

    const response = await fetch(url);
    if (!response.ok) {
      logger.error(`Fio API error: ${response.status} ${await response.text()}`);
      return null;
    }

    return response.json() as Promise<FioStatementResponse>;
  }
}
