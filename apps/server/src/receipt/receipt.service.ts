import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import z from 'zod/v3';

const ReceiptItem = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  unit: z.string().optional().nullable(),
  priceTotal: z.number(),
  description: z.string(),
  category: z.enum([
    'bakery',
    'dairy',
    'beverage',
    'meat',
    'produce',
    'snack',
    'household',
    'other',
  ]),
});

// const ReceiptItem = receiptItemSchema;

const Receipt = z.object({
  date: z.string().datetime(),
  total: z.number(),
  currency: z.string(),
  storeName: z.string().optional().nullable(),
  items: z.array(ReceiptItem),
});

// const Receipt = receiptSchema;

export type ReceiptType = z.infer<typeof Receipt>;

@Injectable()
export class ReceiptService {
  public openAi: OpenAI;
  constructor() {
    this.openAi = new OpenAI();
  }
  async analyze(file: Express.Multer.File): Promise<ReceiptType | null> {
    const mimeType = file.mimetype;
    const base64Image = file.buffer.toString('base64');
    const response = await this.openAi.responses.parse({
      model: 'gpt-4.1-nano',
      input: [
        {
          role: 'system',
          content:
            'You are a receipt analyzer for Czech supermarket receipts. Return only valid JSON that matches the schema.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Analyze this receipt and extract as much data as possible, using all fields in the schema.',
            },
            {
              type: 'input_image',
              image_url: `data:${mimeType};base64,${base64Image}`,
              detail: 'auto',
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(Receipt, 'receipt_analysis'),
      },
    });
    return response.output_parsed;
  }
}

