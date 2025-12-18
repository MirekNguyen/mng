import Elysia from "elysia";

const app = new Elysia({ prefix: "user" });

app.get("/profile", async () => {
  return {
    id: 1,
    name: "Mirek Nguyen",
    email: "mirek@example.com",
    avatarUrl: null,
    age: 25,
    gender: "male",
    height: 175, // cm
    weight: 70, // kg
    targetWeight: 68, // kg
    activityLevel: "moderate",
    goal: "maintain",
    dailyCalorieTarget: 2000,
    createdAt: new Date("2024-01-15T00:00:00Z"),
    streak: 12,
    totalEntries: 145,
  };
});

export { app as userController };
