import type { Booking } from "../types/booking";

/** Create a valid booking payload with sensible defaults. */
export function createBookingData(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: "Jane",
    lastname: "Doe",
    totalprice: 150,
    depositpaid: true,
    bookingdates: {
      checkin: "2026-06-01",
      checkout: "2026-06-10",
    },
    additionalneeds: "Breakfast",
    ...overrides,
  };
}

/** Create a second distinct booking for search/filter tests. */
export function createAlternateBookingData(): Booking {
  return {
    firstname: "John",
    lastname: "Smith",
    totalprice: 250,
    depositpaid: false,
    bookingdates: {
      checkin: "2026-07-15",
      checkout: "2026-07-20",
    },
    additionalneeds: "Late checkout",
  };
}
