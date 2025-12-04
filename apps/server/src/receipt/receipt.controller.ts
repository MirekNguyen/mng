import {
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ReceiptService, ReceiptType } from "./receipt.service";
import { FileInterceptor } from "@nest-lab/fastify-multer";
import { eq } from "drizzle-orm";
import { receipt } from "@/database/schema/receipt.schema";
import { receiptItem } from "@/database/schema/receipt-item.schema";
import { DRIZZLE_PROVIDER, type DrizzleDatabase } from "@/database/drizzle.provider";

@Controller("receipts")
export class ReceiptController {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,

    private readonly receiptService: ReceiptService,
  ) {}

  @Post("analyze")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<ReceiptType | null> {
    const scannedReceipt = await this.receiptService.analyze(file);
    if (!scannedReceipt) return null;
    const insertedReceipt = (
      await this.db
        .insert(receipt)
        .values({
          ...scannedReceipt,
          date: new Date(scannedReceipt.date),
        })
        .returning()
    )[0];
    console.log(insertedReceipt);
    const receiptItems = scannedReceipt.items.map((item) => ({
      ...item,
      receiptId: insertedReceipt.id,
    }));
    const insertedReceiptItems = await this.db.insert(receiptItem).values(receiptItems).returning();
    console.log(insertedReceiptItems);
    return scannedReceipt;
  }

  @Delete(":id")
  async deleteReceipt(@Param("id") id: string) {
    await this.db.delete(receipt).where(eq(receipt.id, Number(id)));
    return { message: `Receipt with id ${id} deleted successfully` };
  }
}
