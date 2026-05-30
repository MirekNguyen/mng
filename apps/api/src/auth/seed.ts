import { logger } from "@mng/logger/logger";
import { auth } from "../auth";
import { db, eq } from "@mng/database/db";
import { user, allowedUsers } from "@mng/database/schema/auth.schema";

export const seedAdmin = async (): Promise<void> => {
  const existing = await db.select().from(user).where(eq(user.email, "admin@mng.local")).limit(1);
  if (existing.length > 0) {
    logger.info("Admin user already exists, skipping seed");
    return;
  }

  await auth.api.signUpEmail({
    body: { email: "admin@mng.local", password: "admin", name: "Admin" },
  });

  await db.insert(allowedUsers).values({
    id: crypto.randomUUID(),
    identifier: "admin@mng.local",
    note: "Admin user",
  });

  logger.info("Admin user seeded successfully (admin@mng.local)");
};
