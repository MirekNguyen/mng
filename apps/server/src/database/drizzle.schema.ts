import { receipt, receiptRelation } from './schema/receipt.schema';
import { receiptItem, receiptItemRelation } from './schema/receipt-item.schema';
import { otherSchema } from './schema/other.schema';

export const schema = {
  receipt,
  receiptRelation,
  receiptItem,
  receiptItemRelation,
  ...otherSchema,
};
