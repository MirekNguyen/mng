import type { SrealityEstateResponse } from "./sreality.schema";
import { srealityEstateResponseSchema } from "./sreality.schema";

const SREALITY_API_BASE = "https://www.sreality.cz/api/cs/v2/estates";

const SREALITY_URL_PATTERN = /sreality\.cz\/detail\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/(\d+)/;

type SrealityItem = SrealityEstateResponse["items"][number];

export const parseEstateIdFromUrl = (url: string): string => {
  const match = SREALITY_URL_PATTERN.exec(url);

  if (!match?.[1]) {
    throw new Error(`Invalid sreality.cz URL: ${url}`);
  }

  return match[1];
};

const findItemByName = (items: SrealityItem[], name: string): SrealityItem | undefined => {
  return items.find((item) => item.name === name);
};

const findItemByType = (items: SrealityItem[], type: string): SrealityItem | undefined => {
  return items.find((item) => item.type === type);
};

const extractStringValue = (items: SrealityItem[], name: string): string | undefined => {
  const item = findItemByName(items, name);
  return typeof item?.value === "string" ? item.value : undefined;
};

const extractBooleanValue = (items: SrealityItem[], name: string): boolean | undefined => {
  const item = findItemByName(items, name);
  return typeof item?.value === "boolean" ? item.value : undefined;
};

const extractUsableArea = (items: SrealityItem[]): number | undefined => {
  const areaItem = findItemByType(items, "area");

  if (!areaItem) {
    return undefined;
  }

  const parsed = Number(areaItem.value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const extractTelecom = (items: SrealityItem[]): string[] | undefined => {
  const item = findItemByName(items, "Telekomunikace");

  if (!item || !Array.isArray(item.value)) {
    return undefined;
  }

  return item.value
    .filter((entry): entry is { value: string } => typeof entry?.value === "string")
    .map((entry) => entry.value);
};

const extractEnergyEfficiency = (
  items: SrealityItem[],
): { description: string | undefined; rating: string | undefined } => {
  const item = findItemByType(items, "energy_efficiency_rating");
  return {
    description: typeof item?.value === "string" ? item.value : undefined,
    rating: item?.value_type,
  };
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
  priceNote: string | undefined;
  usableArea: number | undefined;
  floor: string | undefined;
  buildingType: string | undefined;
  buildingCondition: string | undefined;
  ownership: string | undefined;
  energyEfficiency: string | undefined;
  energyEfficiencyRating: string | undefined;
  locationType: string | undefined;
  telecom: string[] | undefined;
  isElevator: boolean | undefined;
  isBarrierFree: boolean | undefined;
  availableFrom: string | undefined;
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
  const energy = extractEnergyEfficiency(data.items);

  return {
    externalId: extractExternalId(data._links.self.href),
    title: data.name.value,
    description: data.text.value,
    address: data.locality.value,
    price: data.price_czk.value_raw,
    currency: "CZK",
    priceNote: extractStringValue(data.items, "Poznámka k ceně"),
    usableArea: extractUsableArea(data.items),
    floor: extractStringValue(data.items, "Podlaží"),
    buildingType: extractStringValue(data.items, "Stavba"),
    buildingCondition: extractStringValue(data.items, "Stav objektu"),
    ownership: extractStringValue(data.items, "Vlastnictví"),
    energyEfficiency: energy.description,
    energyEfficiencyRating: energy.rating,
    locationType: extractStringValue(data.items, "Umístění objektu"),
    telecom: extractTelecom(data.items),
    isElevator: extractBooleanValue(data.items, "Výtah"),
    isBarrierFree: extractBooleanValue(data.items, "Bezbariérový"),
    availableFrom: extractStringValue(data.items, "Datum nastěhování"),
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
