import { test, expect } from "@playwright/test";
import {
  createBookingData,
  createAlternateBookingData,
} from "../helpers/test-data";
import { ApiClient } from "../helpers/api-client";
import type { BookingId, BookingResponse } from "../types/booking";

test.describe("Booking Search & Filters", () => {
  let client: ApiClient;
  let bookingIdA: number;
  let bookingIdB: number;

  test.beforeAll(async ({ request }) => {
    client = new ApiClient(request);
    await client.authenticate();

    // Create two bookings with distinct data for filter tests
    const resA = await request.post("/booking", {
      data: createBookingData(),
    });
    const bodyA: BookingResponse = await resA.json();
    bookingIdA = bodyA.bookingid;

    const resB = await request.post("/booking", {
      data: createAlternateBookingData(),
    });
    const bodyB: BookingResponse = await resB.json();
    bookingIdB = bodyB.bookingid;
  });

  test.afterAll(async ({ request }) => {
    // Clean up created bookings
    await request.delete(`/booking/${bookingIdA}`, {
      headers: client.authHeaders,
    });
    await request.delete(`/booking/${bookingIdB}`, {
      headers: client.authHeaders,
    });
  });

  test("GET /booking — should list all booking IDs", async ({ request }) => {
    const response = await request.get("/booking");
    expect(response.ok()).toBeTruthy();

    const bookings: BookingId[] = await response.json();
    expect(Array.isArray(bookings)).toBe(true);
    expect(bookings.length).toBeGreaterThan(0);

    // Each entry should have a bookingid
    for (const booking of bookings) {
      expect(booking).toHaveProperty("bookingid");
      expect(typeof booking.bookingid).toBe("number");
    }
  });

  test("should filter bookings by firstname", async ({ request }) => {
    const response = await request.get("/booking", {
      params: { firstname: "Jane" },
    });
    expect(response.ok()).toBeTruthy();

    const bookings: BookingId[] = await response.json();
    const ids = bookings.map((b) => b.bookingid);
    expect(ids).toContain(bookingIdA);
  });

  test("should filter bookings by lastname", async ({ request }) => {
    const response = await request.get("/booking", {
      params: { lastname: "Smith" },
    });
    expect(response.ok()).toBeTruthy();

    const bookings: BookingId[] = await response.json();
    const ids = bookings.map((b) => b.bookingid);
    expect(ids).toContain(bookingIdB);
  });

  test("should filter bookings by checkin date", async ({ request }) => {
    const response = await request.get("/booking", {
      params: { checkin: "2026-06-01" },
    });
    expect(response.ok()).toBeTruthy();

    const bookings: BookingId[] = await response.json();
    expect(Array.isArray(bookings)).toBe(true);
    // Our booking A has checkin 2026-06-01, so it should appear
    const ids = bookings.map((b) => b.bookingid);
    expect(ids).toContain(bookingIdA);
  });

  test("should filter bookings by checkout date", async ({ request }) => {
    const response = await request.get("/booking", {
      params: { checkout: "2026-07-20" },
    });
    expect(response.ok()).toBeTruthy();

    const bookings: BookingId[] = await response.json();
    expect(Array.isArray(bookings)).toBe(true);
  });
});
