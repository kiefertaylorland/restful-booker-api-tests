import { test, expect } from "@playwright/test";

test.describe("Health Check", () => {
  test("GET /ping should return 201", async ({ request }) => {
    const response = await request.get("/ping");
    expect(response.status()).toBe(201);
  });
});
