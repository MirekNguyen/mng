// --- Helper Types ---

/**
 * Common structure for dropdown/selection values in the API
 */
interface CodebookValue {
  name: string;
  value: number;
}

// --- Sub-Entities ---

interface PropertyImage {
  alt: string;
  kind: number;
  order: number;
  url: string;
  width: number;
  height: number;
}

interface PanoramaData {
  hasPanorama: boolean;
  pid: number;
  yaw: number;
}

interface Locality {
  latitude: number;
  longitude: number;
  city: string;
  citySeoName: string;
  cityPart: string;
  cityPartSeoName: string;
  country: string;
  countryId: number;
  district: string;
  districtId: number;
  districtSeoName: string;
  entityType: string;
  houseNumber: string;
  inaccuracyType: string;
  municipality: string | null;
  municipalityId: number;
  municipalitySeoName: string | null;
  quarter: string;
  quarterId: number;
  region: string;
  regionId: number;
  regionSeoName: string;
  street: string;
  streetId: number;
  streetNumber: string;
  streetSeoName: string;
  ward: string | null;
  wardId: number | null;
  wardSeoName: string | null;
  zip: number;
}

interface PremiseLocality {
  latitude: number;
  longitude: number;
  city: string;
  citySeoName: string;
  cityPart: string | null;
  country: string | null;
  district: string;
  districtId: number;
  entityId: number;
  entityType: string;
  houseNumber: string;
  municipality: string | null;
  municipalityId: number;
  quarter: string;
  quarterId: number;
  quarterSeoName: string;
  region: string;
  regionId: number;
  street: string;
  streetId: number;
  streetNumber: string;
  ward: string;
  wardId: number;
  wardSeoName: string;
  zip: number;
}

interface Premise {
  retargetingId: number | null;
  askId: number;
  premisePaidFirmy: boolean;
  companySubjectId: number;
  ico: number;
  id: number;
  isSosCustomAdvertCard: boolean;
  logo: string;
  name: string;
  seoName: string;
  reviewCount: number;
  reviewScore: number;
  webUrl: string;
  webVisibleUrl: string;
  locality: PremiseLocality;
}

interface SellerPhone {
  phoneType: string;
  phone: string;
}

interface Seller {
  rating: number | null;
  reviewCount: number | null;
  image: string;
  email: string;
  id: number;
  name: string;
  phones: SellerPhone[];
}

interface TransportLine {
  departureDirection: number;
  lineId: string;
  lineLabel: string;
  poiId: number;
  terminus: string;
  type: string;
}

interface PointOfInterest {
  description: string;
  distance: number;
  imgUrl: string;
  lat: number;
  lon: number;
  name: string;
  source: string;
  sourceId: number;
  url: string;
  lines: TransportLine[];
  photoUrl: string;
  rating: number;
  reviewCount: number;
  walkDistance?: number; // Optional as not all POIs have it
  time?: number; // Optional
}

interface ExtendedPoiCategory {
  url: string;
  values: PointOfInterest[];
}

interface ExtendedPois {
  transport: ExtendedPoiCategory;
  doctors: ExtendedPoiCategory;
  grocery: ExtendedPoiCategory;
  leisure: ExtendedPoiCategory;
  schools: ExtendedPoiCategory;
  restaurants: ExtendedPoiCategory;
}

// --- Property Parameters ---

interface PropertyParams {
  advertCode: string;
  costOfLiving: string;
  project: string | null;
  acceptanceYear: number | null;
  balcony: boolean;
  balconyArea: number | null;
  basin: boolean;
  basinArea: number | null;
  beginningDate: string | null;
  buildingArea: number | null;
  buildingCondition: CodebookValue;
  buildingType: CodebookValue;
  cellar: boolean;
  cellarArea: number | null;
  circuitBreakerCb: CodebookValue | null;
  commission: number;
  easyAccess: CodebookValue;
  edited: string; // ISO Date string
  electricitySet: CodebookValue[];
  elevator: CodebookValue;
  energyEfficiencyRating: CodebookValue;
  energyPerformanceCertificate: CodebookValue;
  energyPerformanceSummary: number;
  finishDate: string | null;
  firstTourDate: string | null;
  firstTourDateTo: string | null;
  flatClass: CodebookValue;
  floorArea: number;
  floorNumber: number;
  floors: number;
  furnished: CodebookValue;
  garage: boolean;
  garageCount: number | null;
  gardenArea: number | null;
  garret: boolean;
  gasSet: CodebookValue[];
  gullySet: CodebookValue[];
  heatingElementSet: CodebookValue[];
  heatingSet: CodebookValue[];
  heatingSourceSet: CodebookValue[];
  internetConnectionProvider: string | null;
  internetConnectionSpeed: number | null;
  internetConnectionTypeSet: CodebookValue[];
  keywords: string[];
  leaseType: CodebookValue;
  loggia: boolean;
  loggiaArea: number | null;
  lowEnergy: boolean;
  objectAge: number | null;
  objectLocation: CodebookValue;
  ownership: CodebookValue;
  parkingLots: boolean;
  personal: CodebookValue;
  phaseDistributionsCb: CodebookValue | null;
  protection: CodebookValue;
  readyDate: string; // ISO Date string
  reconstructionYear: number;
  roadTypeSet: CodebookValue[];
  sdnEnergyPerformanceAttachmentUrl: string;
  since: string; // ISO Date string
  stateCb: CodebookValue;
  stats: number;
  surroundingsType: CodebookValue;
  telecommunicationSet: CodebookValue[];
  tenantNotPayCommission: boolean;
  terrace: boolean;
  terraceArea: number | null;
  transportSet: CodebookValue[];
  undergroundFloors: number;
  usableArea: number;
  waterHeatSourceSet: CodebookValue[];
  waterSet: CodebookValue[];
  wellTypeSet: CodebookValue[];
  refundableDeposit: number | null;
  priceFlagNegotiationCb: boolean;
  priceNote: string;
}

// --- Main Interface ---

export type RealityProperty = {
  categoryMainCb: CodebookValue;
  categorySubCb: CodebookValue;
  categoryTypeCb: CodebookValue;
  description: string;
  images: PropertyImage[];
  matterportUrl: string;
  panorama: boolean;
  panoramaData: PanoramaData;
  name: string;
  note: string | null;
  locality: Locality;
  price: number;
  priceSummaryCzk: number;
  priceSummaryOldCzk: number | null;
  priceSummaryUnitCb: CodebookValue;
  priceCzk: number;
  priceCzkPerSqM: number;
  priceCurrencyCb: CodebookValue;
  priceUnitCb: CodebookValue;
  premise: Premise;
  seller: Seller;
  nearest: PointOfInterest[];
  extendedPois: ExtendedPois;
  isExclusively: boolean;
  params: PropertyParams;
}
