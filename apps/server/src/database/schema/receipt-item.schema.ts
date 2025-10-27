import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { receipt } from './receipt.schema';

export const receiptCategory = pgEnum('receipt_category', [
  'bakery',
  'dairy',
  'beverage',
  'meat',
  'produce',
  'snack',
  'household',
  'other',
]);

export const receiptItem = pgTable('receipt_item', {
  id: serial().primaryKey(),
  receiptId: integer('receipt_id').references(() => receipt.id, {
    onDelete: 'cascade',
  }),
  date: timestamp('date').defaultNow().notNull(),
  name: varchar('name').notNull(),
  description: text('description'),
  category: receiptCategory('category').notNull(),
  unit: varchar('unit', { length: 10 }),
  price: doublePrecision('price').notNull(),
  quantity: doublePrecision('quantity').notNull(),
  priceTotal: doublePrecision('priceTotal').notNull(),
});

export const receiptItemRelation = relations(receiptItem, ({ one }) => ({
  receipt: one(receipt, {
    fields: [receiptItem.receiptId],
    references: [receipt.id],
  }),
}));

export const receiptItemSchema = createSelectSchema(receiptItem);
