import { otherSchema } from './schema/other.schema';
import { receipt, receiptRelation } from './schema/receipt.schema';
import { receiptItem, receiptItemRelation } from './schema/receipt-item.schema';

export const schema = {
  receipt,
  receiptRelation,
  receiptItem,
  receiptItemRelation,
  ...otherSchema,
};
