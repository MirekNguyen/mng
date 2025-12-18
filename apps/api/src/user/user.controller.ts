import Elysia from "elysia";

const app = new Elysia({ prefix: "user" });

app.get("/profile", async () => {
  // Mock data for unregistered/incomplete user trying out the app
  return {
    id: 1,
    name: "Guest User",
    email: "guest@example.com",
    avatarUrl: null,
    age: null,
    gender: null,
    height: null,
    weight: null,
    targetWeight: null,
    activityLevel: null,
    goal: null,
    dailyCalorieTarget: null,
    createdAt: new Date(),
    streak: 0,
    totalEntries: 0,
  };
});

export { app as userController };
