/// SHA-256 hashing for device API keys. Keys are generated on the device (or
/// server-side at registration) and only their hash is stored.
export const hashApiKey = async (apiKey: string): Promise<string> => {
  const data = new TextEncoder().encode(apiKey);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/// Generates a random, URL-safe API key for a new device.
export const generateApiKey = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};
