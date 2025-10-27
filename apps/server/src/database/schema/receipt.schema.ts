import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { receiptItem } from './receipt-item.schema';

export const receipt = pgTable('receipt', {
  id: serial().primaryKey(),
  total: doublePrecision('total').notNull(),
  date: timestamp('date').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  storeName: varchar('store_name'),
});

export const receiptRelation = relations(receipt, ({ many }) => ({
  receiptItem: many(receiptItem),
}));

export const receiptSchema = createSelectSchema(receipt);
