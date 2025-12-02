import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller';
import { PropertyScraperService } from './property.service';

@Module({
  providers: [PropertyScraperService],
  controllers: [PropertyController]
})
export class PropertyModule {}
