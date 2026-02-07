import { test, expect } from "@playwright/test";
import { ApiClient } from "../helpers/api-client";
import { createBookingData } from "../helpers/test-data";
import type { Booking, BookingResponse } from "../types/booking";

test.describe("Booking CRUD Lifecycle", () => {
  let client: ApiClient;
  let bookingId: number;
  const bookingData: Booking = createBookingData();

  test.beforeAll(async ({ request }) => {
    client = new ApiClient(request);
    await client.authenticate();
  });

  test("POST /booking — should create a new booking", async ({ request }) => {
    const response = await request.post("/booking", {
      data: bookingData,
    });

    expect(response.status()).toBe(200);
    const body: BookingResponse = await response.json();

    // Validate response structure
    expect(body).toHaveProperty("bookingid");
    expect(typeof body.bookingid).toBe("number");
    expect(body).toHaveProperty("booking");

    // Validate returned booking matches input
    expect(body.booking.firstname).toBe(bookingData.firstname);
    expect(body.booking.lastname).toBe(bookingData.lastname);
    expect(body.booking.totalprice).toBe(bookingData.totalprice);
    expect(body.booking.depositpaid).toBe(bookingData.depositpaid);
    expect(body.booking.bookingdates.checkin).toBe(
      bookingData.bookingdates.checkin
    );
    expect(body.booking.bookingdates.checkout).toBe(
      bookingData.bookingdates.checkout
    );
    expect(body.booking.additionalneeds).toBe(bookingData.additionalneeds);

    bookingId = body.bookingid;
  });

  test("GET /booking/:id — should return the created booking", async ({
    request,
  }) => {
    const response = await request.get(`/booking/${bookingId}`);
    expect(response.status()).toBe(200);

    const body: Booking = await response.json();
    expect(body.firstname).toBe(bookingData.firstname);
    expect(body.lastname).toBe(bookingData.lastname);
    expect(body.totalprice).toBe(bookingData.totalprice);
  });

  test("PUT /booking/:id — should fully update the booking", async ({
    request,
  }) => {
    const updatedData: Booking = createBookingData({
      firstname: "Updated",
      lastname: "Guest",
      totalprice: 300,
      additionalneeds: "Airport shuttle",
    });

    const response = await request.put(`/booking/${bookingId}`, {
      data: updatedData,
      headers: client.authHeaders,
    });

    expect(response.status()).toBe(200);
    const body: Booking = await response.json();
    expect(body.firstname).toBe("Updated");
    expect(body.lastname).toBe("Guest");
    expect(body.totalprice).toBe(300);
    expect(body.additionalneeds).toBe("Airport shuttle");
  });

  test("PATCH /booking/:id — should partially update the booking", async ({
    request,
  }) => {
    const response = await request.patch(`/booking/${bookingId}`, {
      data: { firstname: "Patched" },
      headers: client.authHeaders,
    });

    expect(response.status()).toBe(200);
    const body: Booking = await response.json();
    expect(body.firstname).toBe("Patched");
    // Other fields should remain unchanged from the PUT
    expect(body.lastname).toBe("Guest");
  });

  test("DELETE /booking/:id — should delete the booking", async ({
    request,
  }) => {
    const response = await request.delete(`/booking/${bookingId}`, {
      headers: client.authHeaders,
    });
    expect(response.status()).toBe(201);
  });

  test("GET /booking/:id — should return 404 after deletion", async ({
    request,
  }) => {
    const response = await request.get(`/booking/${bookingId}`);
    expect(response.status()).toBe(404);
  });
});
