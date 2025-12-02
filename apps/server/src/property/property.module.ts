import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller';
import { PropertyScraperService } from './property.service';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [PropertyScraperService],
  controllers: [PropertyController]
})
export class PropertyModule {}
