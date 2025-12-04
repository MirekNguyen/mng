import { Module } from "@nestjs/common";
import { ReceiptService } from "./receipt.service";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [ReceiptService],
})
export class ReceiptModule {}
