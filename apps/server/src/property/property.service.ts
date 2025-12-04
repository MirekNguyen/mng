import { Inject, Injectable, Logger } from "@nestjs/common";
import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { IncomingMessage } from "http";
import { ExtractedData } from "./property.entity";
import { RealityProperty, RealityPropertyImage } from "./reality-property.entity";
import { DRIZZLE_PROVIDER, type DrizzleDatabase } from "@/database/drizzle.provider";
import { properties } from "@/database/schema/property.schema";

@Injectable()
export class PropertyScraperService {
  private readonly logger = new Logger(PropertyScraperService.name);

  // Configuration
  private readonly BASE_DOWNLOAD_DIR = path.resolve("./downloads");
  private readonly USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
  private readonly MAGIC_IMG_SUFFIX =
    "?fl=res,1800,1800,1|wrm,/watermark/sreality.png,10|shr,,20|webp,80";

  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase) {}

  /**
   * Main Entry Point: Scrape a list of URLs
   */
  async scrapeListings(urls: string[]): Promise<void> {
    this.logger.log(`🚀 Starting Scraper for ${urls.length} URLs...`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      for (const url of urls) {
        await this.processSingleListing(browser, url);
      }
    } finally {
      await browser.close();
      this.logger.log("🎉 Batch processing complete. Browser closed.");
    }
  }

  /**
   * Orchestrates the scraping process for a single URL
   */
  private async processSingleListing(browser: Browser, url: string): Promise<void> {
    const listingId = this.getListingId(url);
    this.logger.log(`🔎 Processing ID: ${listingId} | URL: ${url}`);

    const page = await browser.newPage();

    try {
      await this.configurePage(page);
      await page.goto(url, { waitUntil: "domcontentloaded" });

      await this.handleConsentWall(page);

      const data = await this.extractPageData(page, listingId);

      if (data) {
        await this.saveListingAssets(data, listingId);
      } else {
        this.logger.error(`❌ Failed to extract data for ${listingId}`);
      }
    } catch (error) {
      this.logger.error(`🚨 Error processing ${url}: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  // --- PHASE 1: BROWSER INTERACTION ---

  private async configurePage(page: Page): Promise<void> {
    await page.setUserAgent(this.USER_AGENT);
    await page.setViewport({ width: 1920, height: 1080 });
  }

  private async handleConsentWall(page: Page): Promise<void> {
    try {
      // Wait briefly for the consent button
      const consentButton = await page.waitForSelector("aria/Souhlasím", {
        timeout: 3000,
      });

      if (consentButton) {
        this.logger.log("🍪 Consent wall detected. Bypass initiated.");
        await Promise.all([
          page.waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: 15000,
          }),
          consentButton.click(),
        ]);
        // Safety buffer for hydration
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (e) {
      // Timeout means no consent wall found, which is fine
    }
  }

  private async extractPageData(page: Page, listingId: string): Promise<ExtractedData | null> {
    this.logger.log("⏳ Waiting for data...");
    try {
      await page.waitForSelector("#__NEXT_DATA__", { timeout: 10000 });

      return await page.evaluate((id) => {
        try {
          const script = document.querySelector("#__NEXT_DATA__");
          if (!script) return null;

          const json = JSON.parse((script as HTMLElement).innerText);
          const queries = json.props.pageProps.dehydratedState.queries;

          // Find the query containing image and price data
          const propertyQuery = queries.find(
            (q: any) => q.state?.data?.images && q.state?.data?.price,
          );

          if (!propertyQuery) return null;

          const d: RealityProperty = propertyQuery.state.data;

          const images = d.images.map((img: RealityPropertyImage) => {
            let link = img.url;
            if (link.startsWith("//")) link = "https:" + link;
            return link + "?fl=res,1800,1800,1|wrm,/watermark/sreality.png,10|shr,,20|webp,80";
          });

          return {
            id: id,
            title: d.name,
            price: d.price,
            address: d.locality.street,
            description: d.description,
            imageUrls: images,
            createdAt: d.params.readyDate,
            updatedAt: d.params.since,
            usableArea: d.params.usableArea,
            refundableDeposit: d.params.refundableDeposit,
            latitude: d.locality.latitude,
            longitude: d.locality.longitude,
            priceNote: d.params.priceNote,
            costOfLiving: d.params.costOfLiving,
          };
        } catch (e) {
          return null;
        }
      }, listingId);
    } catch (error) {
      this.logger.error(`Extraction failed: ${error.message}`);
      return null;
    }
  }

  // --- PHASE 2: DATABASE & DOWNLOADING ---

  private async saveListingAssets(data: ExtractedData, listingId: string): Promise<void> {
    const listingDir = path.join(this.BASE_DOWNLOAD_DIR, listingId);

    // Ensure directory exists (still needed for images)
    if (!fs.existsSync(listingDir)) {
      fs.mkdirSync(listingDir, { recursive: true });
    }

    // 1. DB SAVE OPERATION (Replaces info.json creation)
    this.logger.log(`💾 Saving metadata to Database...`);

    try {
      // Parse numbers safely
      const priceVal =
        typeof data.price === "number" ? data.price : parseInt(String(data.price || 0), 10);
      const areaVal =
        typeof data.usableArea === "number"
          ? data.usableArea
          : parseInt(String(data.usableArea || 0), 10);

      await this.db
        .insert(properties)
        .values({
          externalId: listingId,
          title: data.title,
          address: data.address,
          description: data.description,
          price: isNaN(priceVal) ? 0 : priceVal,
          usableArea: isNaN(areaVal) ? 0 : areaVal,
          imageUrls: data.imageUrls,
          // Store miscellaneous extra fields in the JSONB column
          longitude: data.longitude,
          latitude: data.latitude,
          metaData: {
            refundableDeposit: data.refundableDeposit,
            priceNote: data.priceNote,
            costOfLiving: data.costOfLiving,
            rawCreatedAt: data.createdAt,
          },
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: properties.externalId,
          set: {
            title: data.title,
            price: isNaN(priceVal) ? 0 : priceVal,
            updatedAt: new Date(),
            // Update other fields if you want them refreshed on re-scrape
          },
        });

      this.logger.log(`✅ Database entry created/updated for ${listingId}`);
    } catch (dbError) {
      this.logger.error(`🔥 Database save failed: ${dbError.message}`);
      // Depending on requirements, you might want to return here or continue to download images
    }

    // 2. Download Images (Kept as requested)
    this.logger.log(`⬇️ Downloading ${data.imageUrls.length} images...`);

    for (let i = 0; i < data.imageUrls.length; i++) {
      const fullUrl = data.imageUrls[i] + this.MAGIC_IMG_SUFFIX;
      const fileName = `img_${String(i + 1).padStart(2, "0")}.webp`;
      const filePath = path.join(listingDir, fileName);

      try {
        await this.downloadFile(fullUrl, filePath);
      } catch (err) {
        this.logger.error(`Failed to download image ${i + 1}: ${err.message}`);
      }
    }
    this.logger.log(`✅ Assets processed for ${listingId}`);
  }

  private downloadFile(url: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destination);
      const request = https.get(url, (response: IncomingMessage) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Status Code: ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      });

      request.on("error", (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
    });
  }

  // --- PHASE 3: UTILITIES ---

  private getListingId(url: string): string {
    const cleanUrl = url.split("?")[0];
    if (!cleanUrl) return "unknown";
    const parts = cleanUrl.split("/");
    const lastPart = parts.filter((p) => p.length > 0).pop();
    return lastPart || "unknown";
  }
}
