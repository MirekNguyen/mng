import { db } from "@mng/database/db";
import {
  properties,
  type CreateProperty,
  type Property,
} from "@mng/database/schema/properties.schema";

export const PropertyRepository = {
  async upsertMany(values: CreateProperty[]): Promise<Property[]> {
    return await db
      .insert(properties)
      .values(values)
      .onConflictDoUpdate({
        target: properties.externalId,
        set: {
          title: properties.title,
          description: properties.description,
          address: properties.address,
          price: properties.price,
          currency: properties.currency,
          usableArea: properties.usableArea,
          latitude: properties.latitude,
          longitude: properties.longitude,
          imageUrls: properties.imageUrls,
          updatedAt: new Date(),
        },
      })
      .returning();
  },
};
