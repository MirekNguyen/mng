import { db, sql, getTableColumns } from "@mng/database/db";
import {
  properties,
  type CreateProperty,
  type Property,
} from "@mng/database/schema/properties.schema";

import type { SQL } from "@mng/database/db";

const buildConflictUpdateColumns = <Q extends keyof typeof properties.$inferInsert>(
  columns: Q[],
): Record<Q, SQL> => {
  const cls = getTableColumns(properties);

  return columns.reduce(
    (acc, column) => {
      const colName = cls[column].name;
      acc[column] = sql.raw(`excluded.${colName}`);
      return acc;
    },
    {} as Record<Q, SQL>,
  );
};

export const PropertyRepository = {
  async upsertMany(values: CreateProperty[]): Promise<Property[]> {
    return await db
      .insert(properties)
      .values(values)
      .onConflictDoUpdate({
        target: properties.externalId,
        set: {
          ...buildConflictUpdateColumns([
            "title",
            "description",
            "address",
            "price",
            "currency",
            "priceNote",
            "usableArea",
            "floor",
            "buildingType",
            "buildingCondition",
            "ownership",
            "energyEfficiency",
            "energyEfficiencyRating",
            "locationType",
            "telecom",
            "isElevator",
            "isBarrierFree",
            "availableFrom",
            "latitude",
            "longitude",
            "imageUrls",
          ]),
          updatedAt: new Date(),
        },
      })
      .returning();
  },
};
