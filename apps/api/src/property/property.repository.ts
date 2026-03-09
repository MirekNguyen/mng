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
          priceNote: properties.priceNote,
          usableArea: properties.usableArea,
          floor: properties.floor,
          buildingType: properties.buildingType,
          buildingCondition: properties.buildingCondition,
          ownership: properties.ownership,
          energyEfficiency: properties.energyEfficiency,
          energyEfficiencyRating: properties.energyEfficiencyRating,
          locationType: properties.locationType,
          telecom: properties.telecom,
          isElevator: properties.isElevator,
          isBarrierFree: properties.isBarrierFree,
          availableFrom: properties.availableFrom,
          latitude: properties.latitude,
          longitude: properties.longitude,
          imageUrls: properties.imageUrls,
          updatedAt: new Date(),
        },
      })
      .returning();
  },
};
