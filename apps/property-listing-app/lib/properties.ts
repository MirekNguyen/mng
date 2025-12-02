export interface Property {
  id: string
  title: string
  latitude: number
  longitude: number
  price: number
  address: string
  description: string
  imageUrls: string[]
  createdAt: string
  updatedAt: string
  usableArea: number
  refundableDeposit: number
  costOfLiving: string
  priceNote: string
  commission: number
}

export interface FilterOptions {
  minPrice: number
  maxPrice: number
  minArea: number
  maxArea: number
  searchQuery: string
}

export const defaultFilters: FilterOptions = {
  minPrice: 0,
  maxPrice: 100000,
  minArea: 0,
  maxArea: 500,
  searchQuery: "",
}

export const properties: Property[] = [
  {
    id: "2666013516",
    title: "Pronájem bytu 2+kk 51 m²",
    latitude: 50.08670608204202,
    longitude: 14.45484894225826,
    price: 16000,
    address: "Praha 3, Roháčova",
    description:
      "Nabízím k pronájmu byt 2+kk o podlahové ploše 51 m², umístěný ve 4. nadzemním podlaží klidného bytového domu v ulici Roháčova na Praze 3. Byt je vhodný pro 1–2 osoby.\n\nDispozici tvoří dva pokoje – větší pokoj orientovaný do ulice Roháčova a menší pokoj situovaný do tichého vnitrobloku. Dále malá kuchyň přístupná z chodby, chodba, koupelna, samostatné WC a komora.\n\nByt je vybaven pouze kuchyňskou linkou IKEA s vestavěnou elektrickou varnou deskou, elektrickou troubou a lednicí. Skříň z fotografie a pračka v koupelně náleží předchozímu nájemci a nejsou součástí vybavení. V koupelně je umyvadlo, vana a přípojka na pračku.\n\nVytápění a ohřev vody zajišťuje plynový kombinovaný kondenzační kotel. Energie (plyn a elektřina) se převádějí na nájemce. Orientační měsíční náklad činí cca 2100-2500 Kč. Podlahy jsou z PVC linolea, v koupelně je dlažba.\n\nV domě je k dispozici rychlé optické připojení k internetu. Pokud jde o dopravní dosupnost – autobusová zastávka Rokycanova je vzdálena přibližně 50 metrů, Tachovské náměstí 200 metrů.\n\nByt je k dispozici ihned. Nájemní smlouva minimálně na jeden rok s možností dlouhodobého nájemního vztahu.\n\nV případě zájmu prosím využijte kontaktní formulář a uveďte telefonní číslo, na kterém vás mohu zastihnout.",
    imageUrls: [
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoIBwTcHBAJE6GefE/febc.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/nOztZkD4ZlEAMYFDqFE6GfNe/5e6a.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoIBYCU1BAtE6Ge92/8524.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoICpfjh9wE6GfDv/4022.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoIBXOaFBBCE6GfEk/2286.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoIBP90CBBCE6GfFa/370d.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoICpfjhBAEE6GfPC/fadd.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/nOztZkD4ZlC2Y2EDoeE6GfAk/66de.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/nOztZkD4ZlDrUk0DlAE6GfKU/904c.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/nOztZkD4ZlDgPvvDkmE6GfFh/25f7.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoIBfrHpBBiE6GfCU/303c.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoIBXOaFBAkE6GfM8/70c3.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/nOztZkD4ZlC2Y2EDooE6GfBL/b51f.png",
    ],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:45:00Z",
    usableArea: 51,
    refundableDeposit: 32000,
    costOfLiving: "2100-2500 Kč/měsíc",
    priceNote: "bez energií",
    commission: 16000,
  },
  {
    id: "2666013517",
    title: "Pronájem bytu 3+1 75 m²",
    latitude: 50.0789,
    longitude: 14.4378,
    price: 24500,
    address: "Praha 2, Vinohrady",
    description:
      "Prostorný byt 3+1 v centru Vinohrad s výhledem do parku. Byt byl nedávno kompletně zrekonstruován a je vybaven moderním nábytkem. K dispozici je velká obývací místnost, dva samostatné pokoje, plně vybavená kuchyň a prostorná koupelna s vanou i sprchovým koutem.\n\nVytápění zajišťuje centrální plynový kotel. Byt je orientován na jih, proto je velmi světlý. V okolí je veškerá občanská vybavenost včetně škol, školek a obchodů.\n\nDostupnost MHD je výborná - tramvajová zastávka je 100 metrů od domu.",
    imageUrls: [
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoIBwTcHBAJE6GefE/febc.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/nOztZkD4ZlEAMYFDqFE6GfNe/5e6a.png",
    ],
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-18T12:00:00Z",
    usableArea: 75,
    refundableDeposit: 49000,
    costOfLiving: "3000-3500 Kč/měsíc",
    priceNote: "včetně služeb",
    commission: 24500,
  },
  {
    id: "2666013518",
    title: "Pronájem bytu 1+kk 28 m²",
    latitude: 50.0921,
    longitude: 14.4612,
    price: 12000,
    address: "Praha 3, Žižkov",
    description:
      "Útulný byt 1+kk vhodný pro jednotlivce nebo pár. Byt je kompletně vybaven a připraven k nastěhování. Součástí je kuchyňský kout s lednicí a varnou deskou, koupelna se sprchovým koutem a WC.\n\nByt se nachází v klidné části Žižkova s dobrou dostupností do centra. V blízkosti je Riegrovy sady pro relaxaci.",
    imageUrls: [
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoIBYCU1BAtE6Ge92/8524.png",
      "https://d18-a.sdn.cz/d_18/c_img_of_C/kPxr1WDRoICpfjh9wE6GfDv/4022.png",
    ],
    createdAt: "2024-01-12T14:20:00Z",
    updatedAt: "2024-01-19T09:30:00Z",
    usableArea: 28,
    refundableDeposit: 24000,
    costOfLiving: "1500-1800 Kč/měsíc",
    priceNote: "bez energií",
    commission: 12000,
  },
]

export function parseArea(usableArea: string): number {
  const match = usableArea.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

export function filterProperties(properties: Property[], filters: FilterOptions): Property[] {
  return properties.filter((property) => {
    const area = property.usableArea;

    const matchesPrice = property.price >= filters.minPrice && property.price <= filters.maxPrice
    const matchesArea = area >= filters.minArea && area <= filters.maxArea
    const matchesSearch =
      filters.searchQuery === "" ||
      property.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      property.description.toLowerCase().includes(filters.searchQuery.toLowerCase())

    return matchesPrice && matchesArea && matchesSearch
  })
}

