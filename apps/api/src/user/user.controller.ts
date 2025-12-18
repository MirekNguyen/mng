import { updateUserZodSchema } from "@mng/database/schema/other.schema";
import Elysia from "elysia";
import { UserRepository } from "./user.repository";

const app = new Elysia({ prefix: "user" });

// Hardcoded user ID for now (in production, get from auth token)
const CURRENT_USER_ID = 1;

app.get("/profile", async () => {
  try {
    return await UserRepository.getById(CURRENT_USER_ID);
  } catch {
    // User doesn't exist, create guest user
    return await UserRepository.create({
      email: "guest@example.com",
      firstName: "Guest",
      lastName: "User",
    });
  }
});

app.patch("/profile", async ({ body }) => {
  return await UserRepository.update(CURRENT_USER_ID, body);
}, {
  body: updateUserZodSchema,
});

export { app as userController };
