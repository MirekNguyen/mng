import { otherSchema } from "./schema/other.schema";
import { receipt, receiptRelation } from "./schema/receipt.schema";
import { receiptItem, receiptItemRelation } from "./schema/receipt-item.schema";
import { properties } from "./schema/property.schema";

export const schema = {
  properties,
  receipt,
  receiptRelation,
  receiptItem,
  receiptItemRelation,
  ...otherSchema,
};
