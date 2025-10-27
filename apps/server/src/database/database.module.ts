import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleProvider } from './drizzle.provider';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [...DrizzleProvider],
  exports: [...DrizzleProvider],
})
export class DatabaseModule {}
