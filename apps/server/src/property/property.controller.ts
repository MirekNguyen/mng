import { Controller, Get } from '@nestjs/common';
import { PropertyScraperService } from './property.service';

@Controller('property')
export class PropertyController {
  constructor(private readonly scraperService: PropertyScraperService) {}

  @Get()
  async startScraping(): Promise<{ message: string }> {
    const urls = [
      'https://www.sreality.cz/detail/pronajem/byt/2+1/praha-zizkov-husitska/1462969164',
      'https://www.sreality.cz/detail/pronajem/byt/2+kk/praha-zizkov-rohacova/2666013516',
    ];
    await this.scraperService.scrapeListings(urls);
    return { message: 'Scraping job completed' };
  }
}
