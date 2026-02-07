import { type APIRequestContext } from "@playwright/test";
import type { AuthResponse } from "../types/booking";

/**
 * Thin helper that manages authentication for the Restful-Booker API.
 */
export class ApiClient {
  private token: string | null = null;

  constructor(private request: APIRequestContext) {}

  /** Authenticate and store the token for subsequent requests. */
  async authenticate(
    username = "admin",
    password = "password123"
  ): Promise<string> {
    const response = await this.request.post("/auth", {
      data: { username, password },
    });
    const body: AuthResponse = await response.json();
    this.token = body.token;
    return this.token;
  }

  /** Return headers that include the auth cookie. */
  get authHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error("Not authenticated — call authenticate() first.");
    }
    return { Cookie: `token=${this.token}` };
  }
}
