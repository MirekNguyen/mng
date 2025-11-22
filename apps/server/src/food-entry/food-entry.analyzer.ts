import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod.js';
import { ResponseInputImage } from 'openai/resources/responses/responses.js';
import z from 'zod/v3';

const FoodEntry = z.object({
  name: z.string().describe('The common name of the food or meal.'),
  calories: z.number().describe('Estimated total calories in kcal.'),
  protein: z.number().describe('Estimated total protein in grams.'),
  carbs: z.number().describe('Estimated total carbohydrates in grams.'),
  fats: z.number().describe('Estimated total fats in grams.'),
  amount: z.number().describe('The quantity of the food.'),
  unit: z
    .enum(['serving', 'g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'pcs'])
    .describe('The unit of measurement for the amount.'),
});

type FoodEntryType = z.infer<typeof FoodEntry>;

@Injectable()
export class FoodEntryAnalyzer {
  public openAi: OpenAI;
  constructor() {
    this.openAi = new OpenAI();
  }

  async analyze(files: Express.Multer.File[]): Promise<FoodEntryType | null> {
    if (!files || files.length === 0) {
      return null;
    }
    const imageMessages: ResponseInputImage[] = files.map((file) => {
      const mimeType = file.mimetype;
      const base64Image = file.buffer.toString('base64');
      return {
        type: 'input_image',
        image_url: `data:${mimeType};base64,${base64Image}`,
        detail: 'auto',
      };
    });
    const response = await this.openAi.responses.parse({
      model: 'gpt-5.1',
      input: [
        {
          role: 'system',
          content:
            'You are a food entry analyzer. Analyze the provided images of a meal and return a single, harmonized JSON object with the nutritional information. ' +
            'Never output anything but the JSON. No explanation.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Analyze ALL these images of the SAME meal jointly for better accuracy. ' +
                'Use visual recognition, portion estimation (consider known object sizes for scale), AND if visible, any nutrition facts, ingredients lists, manufacturer stickers, or packaging for nutritional values. ' +
                'Prefer label/panel info if visible, otherwise estimate using up-to-date, regionally appropriate nutrition databases. ' +
                'Harmonize your answer if there are discrepancies. ' +
                "Output a single JSON object. Don't guess if not plausible.",
            },
            ...imageMessages
          ],
        },
      ],
      text: {
        format: zodTextFormat(FoodEntry, 'food_entry_analysis'),
      },
    });
    return response.output_parsed;
  }
}
