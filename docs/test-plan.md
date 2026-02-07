# Test Plan: Restful-Booker API

## 1. Introduction

This document outlines the test strategy for the [Restful-Booker](https://restful-booker.herokuapp.com) REST API — a public hotel booking API used for QA practice.

**Objective:** Validate that all API endpoints function correctly, handle edge cases gracefully, and return responses matching the documented schema.

## 2. Scope

### In Scope

| Area | Endpoints | Coverage |
|------|-----------|----------|
| Health Check | `GET /ping` | Service availability |
| Authentication | `POST /auth` | Valid/invalid token creation |
| Booking CRUD | `POST`, `GET`, `PUT`, `PATCH`, `DELETE /booking` | Full lifecycle |
| Search & Filters | `GET /booking?param=value` | firstname, lastname, checkin, checkout filters |
| Schema Validation | All responses | TypeScript interface conformance |

### Out of Scope

- Performance/load testing
- XML payload format (testing JSON only)
- UI (this is a headless API)

## 3. Test Environment

| Component | Detail |
|-----------|--------|
| **API Base URL** | `https://restful-booker.herokuapp.com` |
| **Auth credentials** | `admin` / `password123` |
| **Framework** | Playwright (TypeScript) |
| **CI** | GitHub Actions |
| **Data reset** | API resets every ~10 minutes — tests create and clean up their own data |

## 4. Test Cases

### 4.1 Health Check

| ID | Test Case | Expected |
|----|-----------|----------|
| HC-01 | `GET /ping` | 201 Created |

### 4.2 Authentication

| ID | Test Case | Expected |
|----|-----------|----------|
| AUTH-01 | Valid credentials → `POST /auth` | 200 with `{ token: string }` |
| AUTH-02 | Invalid credentials → `POST /auth` | 200 with `{ reason: "Bad credentials" }` |
| AUTH-03 | ApiClient stores token correctly | Token accessible via `authHeaders` |

### 4.3 Booking CRUD

| ID | Test Case | Expected |
|----|-----------|----------|
| CRUD-01 | Create booking (`POST /booking`) | 200, returns `bookingid` + `booking` object matching input |
| CRUD-02 | Read booking (`GET /booking/:id`) | 200, body matches created data |
| CRUD-03 | Full update (`PUT /booking/:id`) | 200, all fields updated |
| CRUD-04 | Partial update (`PATCH /booking/:id`) | 200, only specified fields updated |
| CRUD-05 | Delete booking (`DELETE /booking/:id`) | 201 |
| CRUD-06 | Read after delete (`GET /booking/:id`) | 404 |

### 4.4 Search & Filters

| ID | Test Case | Expected |
|----|-----------|----------|
| SRCH-01 | List all bookings | Array of `{ bookingid }` objects |
| SRCH-02 | Filter by firstname | Results include expected booking |
| SRCH-03 | Filter by lastname | Results include expected booking |
| SRCH-04 | Filter by checkin date | Results include matching bookings |
| SRCH-05 | Filter by checkout date | Array returned (may be empty if no matches) |

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API resets data every ~10 min | Tests may find stale data | Each test creates its own data; cleanup in `afterAll` |
| External API may be down | Tests fail through no code fault | CI retries (2 on CI); health check test runs first |
| Shared public API | Other users' data may interfere | Tests assert on specific booking IDs created during the run |

## 6. Entry & Exit Criteria

**Entry:** API responds to `GET /ping` with 201.

**Exit:** All test cases pass. HTML report generated and reviewed.

## 7. Deliverables

- Automated test suite (`tests/`)
- TypeScript type definitions (`types/booking.ts`)
- CI pipeline (`.github/workflows/playwright.yml`)
- HTML test report (artifact in GitHub Actions)
- This test plan document
