import type { BankingProvider } from "./types";
import { RevolutProvider } from "./provider/revolut";
import { CsasProvider } from "./provider/csas";
import { MockProvider } from "./provider/mock";
import { logger } from "@mng/logger/logger";

let instance: BankingProvider | null = null;

export function getBankingProvider(): BankingProvider {
  if (instance) return instance;

  const providerName = process.env.BANKING_PROVIDER ?? "revolut";

  switch (providerName) {
    case "revolut":
      instance = new RevolutProvider();
      break;
    case "csas":
      instance = new CsasProvider();
      break;
    case "mock":
      instance = new MockProvider();
      break;
    default:
      throw new Error(
        `Unknown BANKING_PROVIDER: "${providerName}". Must be "revolut", "csas", or "mock".`,
      );
  }

  logger.info(`Banking provider initialized: ${instance.name}`);
  return instance;
}

export function resetProvider(): void {
  instance = null;
}
