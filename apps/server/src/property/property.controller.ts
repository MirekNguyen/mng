import { Controller, Get, Inject } from "@nestjs/common";
import { PropertyScraperService } from "./property.service";
import {
  DRIZZLE_PROVIDER,
  type DrizzleDatabase,
} from "@/database/drizzle.provider";

@Controller("property")
export class PropertyController {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly scraperService: PropertyScraperService,
  ) {}

  @Get("scrape")
  async startScraping(): Promise<{ message: string }> {
    const urls = [
      "https://www.sreality.cz/detail/pronajem/byt/2+1/praha-zizkov-husitska/1462969164",
      "https://www.sreality.cz/detail/pronajem/byt/2+kk/praha-zizkov-rohacova/2666013516",
    ];
    await this.scraperService.scrapeListings(urls);
    return { message: "Scraping job completed" };
  }

  @Get()
  async getProperties() {
    return await this.db.query.properties.findMany();
  }
}
