import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";

test.describe("Authentication", () => {
  test("should create a token with valid credentials", async ({ request }) => {
    const response = await request.post("/auth", {
      data: { username: "admin", password: "password123" },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
  });

  test("should reject invalid credentials", async ({ request }) => {
    const response = await request.post("/auth", {
      data: { username: "wrong", password: "credentials" },
    });

    const body = await response.json();
    expect(body).toHaveProperty("reason", "Bad credentials");
  });

  test("ApiClient helper should store token", async ({ request }) => {
    const client = new ApiClient(request);
    const token = await client.authenticate();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(client.authHeaders).toHaveProperty("Cookie", `token=${token}`);
  });
});
