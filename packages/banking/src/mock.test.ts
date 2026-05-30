import { describe, expect, it } from "vitest";
import { MockProvider } from "./mock.js";

describe("MockProvider", () => {
  it("lists institutions", async () => {
    const provider = new MockProvider();
    const institutions = await provider.listInstitutions();
    expect(institutions.length).toBeGreaterThanOrEqual(3);
    expect(institutions[0]!.name).toBe("First National Bank");
  });

  it("creates a connection with seeded accounts", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });

    expect(connection.status).toBe("connected");
    expect(connection.institutionId).toBe("ins_001");

    const accounts = await provider.listAccounts(connection.id);
    expect(accounts.length).toBe(2);
    expect(accounts[0]!.type).toBe("checking");
    expect(accounts[1]!.type).toBe("savings");
  });

  it("lists transactions for an account", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });
    const accounts = await provider.listAccounts(connection.id);
    const transactions = await provider.listTransactions(accounts[0]!.id);

    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0]!.description).toBeDefined();
    expect(transactions[0]!.amountCents).toBeGreaterThan(0);
  });

  it("filters transactions by status", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });
    const accounts = await provider.listAccounts(connection.id);

    const pending = await provider.listTransactions(accounts[0]!.id, {
      status: "pending",
    });

    expect(pending.length).toBeGreaterThan(0);
    for (const tx of pending) {
      expect(tx.status).toBe("pending");
    }
  });

  it("gets a single transaction", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });
    const accounts = await provider.listAccounts(connection.id);
    const transactions = await provider.listTransactions(accounts[0]!.id);

    const tx = await provider.getTransaction(transactions[0]!.id);
    expect(tx.id).toBe(transactions[0]!.id);
  });

  it("gets account balance", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });
    const accounts = await provider.listAccounts(connection.id);

    const balance = await provider.getBalance(accounts[0]!.id);
    expect(balance.currentCents).toBeDefined();
    expect(balance.currency).toBe("USD");
  });

  it("creates a payment and deducts balance", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });
    const accounts = await provider.listAccounts(connection.id);
    const account = accounts[0]!;
    const originalBalance = account.currentBalanceCents;

    const payment = await provider.createPayment({
      amountCents: 50000,
      currency: "USD",
      description: "Test payment",
      sourceAccountId: account.id,
      recipientId: "recip_001",
      method: "ach",
      referenceId: null,
      scheduledDate: null,
    });

    expect(payment.status).toBe("completed");
    expect(payment.amountCents).toBe(50000);

    const updatedAccount = await provider.getAccount(account.id);
    expect(updatedAccount.currentBalanceCents).toBe(
      originalBalance - 50000,
    );
  });

  it("rejects payment with insufficient funds", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });
    const accounts = await provider.listAccounts(connection.id);

    await expect(
      provider.createPayment({
        amountCents: 999999999,
        currency: "USD",
        description: "Overdraft test",
        sourceAccountId: accounts[0]!.id,
        recipientId: "recip_001",
        method: "ach",
        referenceId: null,
        scheduledDate: null,
      }),
    ).rejects.toThrow("Insufficient funds");
  });

  it("syncs transactions and returns result", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });

    const result = await provider.syncTransactions(connection.id);
    expect(result.accountsSynced).toBe(2);
    expect(result.connectionId).toBe(connection.id);
    expect(result.syncedAt).toBeInstanceOf(Date);
  });

  it("deletes a connection and cascades cleanup", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
    });
    const connectionId = connection.id;

    await provider.deleteConnection(connectionId);
    await expect(provider.getConnection(connectionId)).rejects.toThrow(
      "Connection not found",
    );

    const accounts = await provider.listAccounts(connectionId);
    expect(accounts.length).toBe(0);
  });

  it("updates connection metadata", async () => {
    const provider = new MockProvider();
    const connection = await provider.createConnection({
      institutionId: "ins_001",
      username: "test_user",
    });

    const updated = await provider.updateConnection(connection.id, {
      username: "updated_user",
    });
    expect(updated.id).toBe(connection.id);
  });
});
