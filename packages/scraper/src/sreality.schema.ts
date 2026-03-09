import z from "zod";

const srealityImageSchema = z.object({
  _links: z.object({
    self: z.object({ href: z.string() }),
  }),
});

export const srealityEstateResponseSchema = z.object({
  name: z.object({
    value: z.string(),
  }),
  text: z.object({
    value: z.string(),
  }),
  locality: z.object({
    value: z.string(),
  }),
  price_czk: z.object({
    value_raw: z.number(),
  }),
  map: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  items: z.array(
    z.object({
      type: z.string(),
      value: z.unknown(),
      unit: z.string().optional(),
    }),
  ),
  _embedded: z.object({
    images: z.array(srealityImageSchema),
  }),
  _links: z.object({
    self: z.object({ href: z.string() }),
  }),
});

export type SrealityEstateResponse = z.infer<typeof srealityEstateResponseSchema>;
