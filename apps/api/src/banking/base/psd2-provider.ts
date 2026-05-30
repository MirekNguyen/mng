import https from "node:https";
import fs from "node:fs/promises";
import { logger } from "@mng/logger/logger";

export interface PSD2Config {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  certPath: string;
  certKeyPath?: string;
}

export interface PSD2ConsentResponse {
  consentId: string;
  authUrl: string;
}

export interface PSD2TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface BerlinGroupAccount {
  resourceId: string;
  iban: string;
  currency: string;
  name: string;
  product: string;
  cashAccountType: string;
  status: string;
  balances?: Array<{
    balanceAmount: { amount: string; currency: string };
    balanceType: string;
  }>;
}

export interface BerlinGroupTransaction {
  transactionId: string;
  bookingDate: string;
  valueDate: string;
  transactionAmount: { amount: string; currency: string };
  creditorName: string;
  debtorName: string;
  remittanceInformationUnstructured: string;
  bankTransactionCode: string;
  proprietaryBankTransactionCode: string;
}

export class PSD2BaseProvider {
  protected config: PSD2Config;
  private loadedCert: string | null = null;
  private loadedKey: string | null = null;

  constructor(config: PSD2Config) {
    this.config = config;
  }

  protected async loadCerts(): Promise<{ cert: string; key: string }> {
    if (this.loadedCert && this.loadedKey) {
      return { cert: this.loadedCert, key: this.loadedKey };
    }
    const cert = await fs.readFile(this.config.certPath, "utf-8");
    const key = this.config.certKeyPath
      ? await fs.readFile(this.config.certKeyPath, "utf-8")
      : cert;
    this.loadedCert = cert;
    this.loadedKey = key;
    return { cert, key };
  }

  protected async mtlsFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const { cert, key } = await this.loadCerts();
    const url = `${this.config.baseUrl}${path}`;
    const urlObj = new URL(url);

    return new Promise<Response>((resolve, reject) => {
      const req = https.request(
        {
          hostname: urlObj.hostname,
          port: Number(urlObj.port) || 443,
          path: urlObj.pathname + urlObj.search,
          method: options.method || "GET",
          headers: (options.headers as Record<string, string>) ?? {},
          cert,
          key,
          rejectUnauthorized: process.env.NODE_ENV === "production",
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const body = Buffer.concat(chunks).toString();
            resolve(
              new Response(body, {
                status: res.statusCode,
                statusText: res.statusMessage,
                headers: new Headers(res.headers as Record<string, string>),
              }),
            );
          });
        },
      );
      req.on("error", reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  async initiateConsent(
    scopes: string[],
    redirectUri: string,
  ): Promise<PSD2ConsentResponse> {
    const basicAuth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString("base64");

    const body = {
      access: {
        accounts: scopes.includes("accounts") ? [{ iban: "*" }] : [],
        transactions: scopes.includes("transactions") ? [{ iban: "*" }] : [],
        balances: scopes.includes("balances") ? [{ iban: "*" }] : [],
      },
      recurringIndicator: true,
      validUntil: new Date(Date.now() + 90 * 86400000)
        .toISOString()
        .split("T")[0],
      frequencyPerDay: 4,
      combinedServiceIndicator: false,
    };

    const response = await this.mtlsFetch("/consents", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID(),
        "PSU-IP-Address": "127.0.0.1",
        "TPP-Redirect-URI": redirectUri,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`PSD2 consent initiation failed: ${response.status} ${error}`);
      throw new Error(`PSD2 consent failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      consentId: string;
      _links?: {
        scaRedirect?: { href: string };
        scaOAuth?: { href: string };
      };
    };

    const authUrl =
      data._links?.scaRedirect?.href ?? data._links?.scaOAuth?.href ?? "";
    return { consentId: data.consentId, authUrl };
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<PSD2TokenResponse> {
    const basicAuth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString("base64");

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(`${this.config.baseUrl}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Request-ID": crypto.randomUUID(),
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`PSD2 token exchange failed: ${response.status} ${error}`);
      throw new Error(`PSD2 token exchange failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    };
  }

  async refreshToken(token: string): Promise<PSD2TokenResponse> {
    const basicAuth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString("base64");

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token,
    });

    const response = await fetch(`${this.config.baseUrl}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Request-ID": crypto.randomUUID(),
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`PSD2 token refresh failed: ${response.status} ${error}`);
      throw new Error(`PSD2 token refresh failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    };
  }

  async getAccounts(
    accessToken: string,
  ): Promise<BerlinGroupAccount[]> {
    const response = await fetch(`${this.config.baseUrl}/accounts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Request-ID": crypto.randomUUID(),
      },
    });

    this.throwOnPsd2Error(response, "getAccounts");

    const data = (await response.json()) as { accounts: BerlinGroupAccount[] };
    return data.accounts;
  }

  async getTransactions(
    accessToken: string,
    accountId: string,
    from?: Date,
    to?: Date,
  ): Promise<BerlinGroupTransaction[]> {
    const params = new URLSearchParams({ bookingStatus: "both" });
    if (from) params.set("dateFrom", from.toISOString().split("T")[0]);
    if (to) params.set("dateTo", to.toISOString().split("T")[0]);

    const response = await fetch(
      `${this.config.baseUrl}/accounts/${accountId}/transactions?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Request-ID": crypto.randomUUID(),
        },
      },
    );

    this.throwOnPsd2Error(response, "getTransactions");

    const data = (await response.json()) as {
      transactions: {
        booked: BerlinGroupTransaction[];
        pending: BerlinGroupTransaction[];
      };
    };

    return [
      ...(data.transactions.booked ?? []),
      ...(data.transactions.pending ?? []),
    ];
  }

  protected throwOnPsd2Error(response: Response, context: string): void {
    if (response.status === 401) {
      throw new Error("PSD2 consent expired — re-authorization required");
    }
    if (response.status === 403) {
      throw new Error("PSD2 SCA required — strong customer authentication needed");
    }
    if (!response.ok) {
      logger.error(`PSD2 ${context} failed: ${response.status}`);
      throw new Error(`PSD2 ${context} failed: ${response.status}`);
    }
  }
}
