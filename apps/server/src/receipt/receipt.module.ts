import { Module } from "@nestjs/common";
import { ReceiptService } from "./receipt.service";
import { DatabaseModule } from "src/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [ReceiptService],
})
export class ReceiptModule {}
