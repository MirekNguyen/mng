const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type FetchOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

const request = async (path: string, options: FetchOptions = {}) => {
  const res = await fetch(`${API_BASE}/banking${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
};

export const api = {
  getAccounts() {
    return request("/accounts");
  },

  getTransactions(options?: { limit?: number; offset?: number; category?: string; direction?: string }) {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    if (options?.category) params.set("category", options.category);
    if (options?.direction) params.set("direction", options.direction);
    const qs = params.toString();
    return request(`/transactions${qs ? `?${qs}` : ""}`);
  },

  getInvestments() {
    return request("/investments");
  },

  getSpending(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return request(`/spending${qs ? `?${qs}` : ""}`);
  },

  loadDemo() {
    return request("/load-demo", { method: "POST" });
  },

  getStatus() {
    return request("/status");
  },
};
