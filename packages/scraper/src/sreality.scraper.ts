import type { SrealityEstateResponse } from "./sreality.schema";
import { srealityEstateResponseSchema } from "./sreality.schema";

const SREALITY_API_BASE = "https://www.sreality.cz/api/cs/v2/estates";

const SREALITY_URL_PATTERN = /sreality\.cz\/detail\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/(\d+)/;

export const parseEstateIdFromUrl = (url: string): string => {
  const match = SREALITY_URL_PATTERN.exec(url);

  if (!match?.[1]) {
    throw new Error(`Invalid sreality.cz URL: ${url}`);
  }

  return match[1];
};

const extractUsableArea = (items: SrealityEstateResponse["items"]): number | undefined => {
  const areaItem = items.find((item) => item.type === "area");

  if (!areaItem) {
    return undefined;
  }

  const parsed = Number(areaItem.value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const extractImageUrls = (images: SrealityEstateResponse["_embedded"]["images"]): string[] => {
  return images.map((image) => image._links.self.href);
};

const extractExternalId = (selfHref: string): string => {
  const segments = selfHref.split("/");
  const lastSegment = segments.at(-1);

  if (!lastSegment) {
    throw new Error(`Cannot extract external ID from href: ${selfHref}`);
  }

  return lastSegment;
};

type ScrapedProperty = {
  externalId: string;
  title: string;
  description: string;
  address: string;
  price: number;
  currency: string;
  usableArea: number | undefined;
  latitude: number;
  longitude: number;
  imageUrls: string[];
};

export const scrapeEstate = async (estateId: string): Promise<ScrapedProperty> => {
  const response = await fetch(`${SREALITY_API_BASE}/${estateId}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch estate ${estateId}: ${response.status} ${response.statusText}`,
    );
  }

  const rawData: unknown = await response.json();
  const data = srealityEstateResponseSchema.parse(rawData);

  return {
    externalId: extractExternalId(data._links.self.href),
    title: data.name.value,
    description: data.text.value,
    address: data.locality.value,
    price: data.price_czk.value_raw,
    currency: "CZK",
    usableArea: extractUsableArea(data.items),
    latitude: data.map.lat,
    longitude: data.map.lon,
    imageUrls: extractImageUrls(data._embedded.images),
  };
};

export const scrapeEstateFromUrl = async (url: string): Promise<ScrapedProperty> => {
  const estateId = parseEstateIdFromUrl(url);
  return scrapeEstate(estateId);
};

export const scrapeEstatesFromUrls = async (urls: string[]): Promise<ScrapedProperty[]> => {
  return Promise.all(urls.map(scrapeEstateFromUrl));
};
