import { logger } from "@mng/logger/logger";

const REVOLUT_API_BASE = "https://ob.revolut.com";
const REVOLUT_SANDBOX_BASE = "https://sandbox-ob.revolut.com";

type RevolutConfig = {
  clientId: string;
  clientSecret: string;
  isSandbox?: boolean;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type RevolutAccount = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  state: "active" | "inactive";
  public: boolean;
  accountNumber?: string;
  sortCode?: string;
  iban?: string;
};

type RevolutTransaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  counterparty: string;
  counterparty_account: string;
  reference: string;
  state: "completed" | "pending" | "declined";
  created_at: string;
  updated_at: string;
  merchant?: {
    name: string;
    city: string;
    country: string;
    category_code: string;
  };
};

type RevolutPosition = {
  id: string;
  ticker: string;
  name: string;
  type: "stock" | "etf" | "crypto" | "commodity";
  quantity: number;
  average_buy_price: number;
  current_price: number;
  currency: string;
  total_cost: number;
  total_value: number;
  pl: number;
  pl_percent: number;
};

type RevolutOrder = {
  id: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  fee: number;
  currency: string;
  status: "executed" | "pending" | "failed";
  executed_at: string;
};

export class RevolutService {
  private config: RevolutConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: RevolutConfig, accessToken?: string, tokenExpiresAt?: number) {
    this.config = config;
    if (accessToken) this.accessToken = accessToken;
    if (tokenExpiresAt) this.tokenExpiresAt = tokenExpiresAt;
  }

  private get baseUrl(): string {
    return this.config.isSandbox ? REVOLUT_SANDBOX_BASE : REVOLUT_API_BASE;
  }

  static getAuthUrl(config: RevolutConfig, redirectUri: string): string {
    const base = config.isSandbox ? REVOLUT_SANDBOX_BASE : REVOLUT_API_BASE;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "READ",
    });
    return `${base}/auth/authorize?${params}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Revolut token exchange failed: ${error}`);
      throw new Error("Revolut token exchange failed");
    }

    const data = (await response.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
    return data;
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Revolut token refresh failed: ${error}`);
      throw new Error("Revolut token refresh failed");
    }

    const data = (await response.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
    return data;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Revolut API error: ${response.status} ${error}`);
      throw new Error(`Revolut API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getAccounts(): Promise<RevolutAccount[]> {
    return this.request<RevolutAccount[]>("/accounts");
  }

  async getTransactions(accountId: string, from?: string, to?: string): Promise<RevolutTransaction[]> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", "100");

    return this.request<RevolutTransaction[]>(`/accounts/${accountId}/transactions?${params}`);
  }

  async getPositions(): Promise<RevolutPosition[]> {
    return this.request<RevolutPosition[]>("/positions");
  }

  async getOrders(positionId: string): Promise<RevolutOrder[]> {
    return this.request<RevolutOrder[]>(`/positions/${positionId}/orders`);
  }
}

// Demo/mock data for development without real API credentials
export const DEMO_ACCOUNTS: RevolutAccount[] = [
  { id: "acc_1", name: "Main Account", balance: 8432.50, currency: "GBP", state: "active", public: false, accountNumber: "12345678", sortCode: "04-00-04", iban: "GB04REVO12345678" },
  { id: "acc_2", name: "Savings", balance: 25000.00, currency: "GBP", state: "active", public: false, accountNumber: "87654321", sortCode: "04-00-04", iban: "GB04REVO87654321" },
  { id: "acc_3", name: "Investment Account", balance: 15678.90, currency: "GBP", state: "active", public: false },
  { id: "acc_4", name: "Crypto", balance: 3450.00, currency: "GBP", state: "active", public: false },
];

export const DEMO_TRANSACTIONS: RevolutTransaction[] = [
  { id: "tx_1", type: "card_payment", amount: -42.50, currency: "GBP", description: "Tesco Express", counterparty: "Tesco", counterparty_account: "", reference: "POS 123456", state: "completed", created_at: "2026-05-26T12:30:00Z", updated_at: "2026-05-26T12:30:00Z", merchant: { name: "Tesco Express", city: "London", country: "GB", category_code: "5411" } },
  { id: "tx_2", type: "card_payment", amount: -8.99, currency: "GBP", description: "Netflix", counterparty: "Netflix", counterparty_account: "", reference: "SUB 789012", state: "completed", created_at: "2026-05-26T10:00:00Z", updated_at: "2026-05-26T10:00:00Z", merchant: { name: "Netflix", city: "", country: "US", category_code: "5815" } },
  { id: "tx_3", type: "card_payment", amount: -120.00, currency: "GBP", description: "Trainline", counterparty: "Trainline", counterparty_account: "", reference: "TICKET 345678", state: "completed", created_at: "2026-05-25T08:15:00Z", updated_at: "2026-05-25T08:15:00Z", merchant: { name: "Trainline", city: "London", country: "GB", category_code: "4111" } },
  { id: "tx_4", type: "topup", amount: 2000.00, currency: "GBP", description: "Salary deposit", counterparty: "Acme Corp", counterparty_account: "SALARY", reference: "PAYROLL MAY", state: "completed", created_at: "2026-05-25T00:00:00Z", updated_at: "2026-05-25T00:00:00Z" },
  { id: "tx_5", type: "card_payment", amount: -65.00, currency: "GBP", description: "PureGym", counterparty: "PureGym", counterparty_account: "", reference: "DD 901234", state: "completed", created_at: "2026-05-24T07:00:00Z", updated_at: "2026-05-24T07:00:00Z", merchant: { name: "PureGym", city: "London", country: "GB", category_code: "7999" } },
  { id: "tx_6", type: "card_payment", amount: -15.50, currency: "GBP", description: "Starbucks", counterparty: "Starbucks", counterparty_account: "", reference: "POS 567890", state: "completed", created_at: "2026-05-24T09:30:00Z", updated_at: "2026-05-24T09:30:00Z", merchant: { name: "Starbucks", city: "London", country: "GB", category_code: "5812" } },
  { id: "tx_7", type: "card_payment", amount: -200.00, currency: "GBP", description: "Amazon.co.uk", counterparty: "Amazon", counterparty_account: "", reference: "ORDER 1234567", state: "completed", created_at: "2026-05-23T14:00:00Z", updated_at: "2026-05-23T14:00:00Z", merchant: { name: "Amazon UK", city: "London", country: "GB", category_code: "5311" } },
  { id: "tx_8", type: "transfer", amount: 500.00, currency: "GBP", description: "Transfer from savings", counterparty: "Mirek Nguyen", counterparty_account: "Savings", reference: "INTERNAL", state: "completed", created_at: "2026-05-22T16:00:00Z", updated_at: "2026-05-22T16:00:00Z" },
  { id: "tx_9", type: "card_payment", amount: -3.50, currency: "GBP", description: "Monzo card cash withdrawal", counterparty: "Monzo", counterparty_account: "", reference: "ATM 789012", state: "completed", created_at: "2026-05-22T11:00:00Z", updated_at: "2026-05-22T11:00:00Z" },
  { id: "tx_10", type: "card_payment", amount: -89.99, currency: "GBP", description: "Octopus Energy", counterparty: "Octopus Energy", counterparty_account: "", reference: "DD 3456789", state: "completed", created_at: "2026-05-21T06:00:00Z", updated_at: "2026-05-21T06:00:00Z", merchant: { name: "Octopus Energy", city: "London", country: "GB", category_code: "4900" } },
  { id: "tx_11", type: "card_payment", amount: -35.00, currency: "GBP", description: "Vodafone", counterparty: "Vodafone", counterparty_account: "", reference: "DD 2345678", state: "completed", created_at: "2026-05-20T06:00:00Z", updated_at: "2026-05-20T06:00:00Z", merchant: { name: "Vodafone", city: "Newbury", country: "GB", category_code: "4814" } },
  { id: "tx_12", type: "card_payment", amount: -54.00, currency: "GBP", description: "Waitrose", counterparty: "Waitrose", counterparty_account: "", reference: "POS 901234", state: "completed", created_at: "2026-05-19T15:30:00Z", updated_at: "2026-05-19T15:30:00Z", merchant: { name: "Waitrose", city: "London", country: "GB", category_code: "5411" } },
];

export const DEMO_POSITIONS: RevolutPosition[] = [
  { id: "pos_1", ticker: "VWRL.L", name: "Vanguard FTSE All-World UCITS ETF", type: "etf", quantity: 120, average_buy_price: 95.50, current_price: 102.30, currency: "GBP", total_cost: 11460.00, total_value: 12276.00, pl: 816.00, pl_percent: 7.12 },
  { id: "pos_2", ticker: "AAPL", name: "Apple Inc.", type: "stock", quantity: 50, average_buy_price: 175.20, current_price: 189.50, currency: "USD", total_cost: 8760.00, total_value: 9475.00, pl: 715.00, pl_percent: 8.16 },
  { id: "pos_3", ticker: "BTC", name: "Bitcoin", type: "crypto", quantity: 0.05, average_buy_price: 45000.00, current_price: 52000.00, currency: "USD", total_cost: 2250.00, total_value: 2600.00, pl: 350.00, pl_percent: 15.56 },
  { id: "pos_4", ticker: "VUSA.L", name: "Vanguard S&P 500 UCITS ETF", type: "etf", quantity: 30, average_buy_price: 78.00, current_price: 84.20, currency: "GBP", total_cost: 2340.00, total_value: 2526.00, pl: 186.00, pl_percent: 7.95 },
  { id: "pos_5", ticker: "ETH", name: "Ethereum", type: "crypto", quantity: 0.5, average_buy_price: 2800.00, current_price: 3100.00, currency: "USD", total_cost: 1400.00, total_value: 1550.00, pl: 150.00, pl_percent: 10.71 },
  { id: "pos_6", ticker: "GOOGL", name: "Alphabet Inc.", type: "stock", quantity: 10, average_buy_price: 165.00, current_price: 172.80, currency: "USD", total_cost: 1650.00, total_value: 1728.00, pl: 78.00, pl_percent: 4.73 },
];

export const DEMO_SPENDING_CATEGORIES: { name: string; icon: string; color: string; budget: number }[] = [
  { name: "Groceries", icon: "shopping-cart", color: "#22c55e", budget: 400 },
  { name: "Dining Out", icon: "utensils", color: "#f59e0b", budget: 200 },
  { name: "Transport", icon: "car", color: "#3b82f6", budget: 150 },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899", budget: 300 },
  { name: "Bills & Utilities", icon: "file-text", color: "#8b5cf6", budget: 500 },
  { name: "Entertainment", icon: "film", color: "#14b8a6", budget: 100 },
  { name: "Health & Fitness", icon: "heart", color: "#ef4444", budget: 150 },
  { name: "Transfers", icon: "arrow-left-right", color: "#6366f1", budget: 0 },
  { name: "Income", icon: "arrow-down-circle", color: "#22c55e", budget: 0 },
  { name: "Other", icon: "more-horizontal", color: "#a1a1aa", budget: 0 },
];
