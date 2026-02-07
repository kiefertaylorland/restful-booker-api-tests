# Restful-Booker API Tests

[![API Tests](https://github.com/YOUR_USERNAME/restful-booker-api-tests/actions/workflows/playwright.yml/badge.svg)](https://github.com/YOUR_USERNAME/restful-booker-api-tests/actions/workflows/playwright.yml)

API test suite for [Restful-Booker](https://restful-booker.herokuapp.com) — a public hotel booking REST API. Built with **TypeScript** and **Playwright's** built-in request API.

## What's Tested

| Area | Tests | Description |
|------|-------|-------------|
| **Health** | 1 | `GET /ping` availability check |
| **Auth** | 3 | Token creation (valid + invalid credentials), ApiClient helper |
| **CRUD** | 6 | Create → Read → Full Update → Partial Update → Delete → Verify 404 |
| **Search** | 5 | List all bookings, filter by firstname/lastname/checkin/checkout |

**Total: 15 test cases.**

## Tech Stack

- **Language:** TypeScript
- **Framework:** Playwright (API request context — no browser needed)
- **CI:** GitHub Actions
- **Docs:** Test plan in `docs/test-plan.md`

## Project Structure

```
restful-booker-api-tests/
├── .github/workflows/
│   └── playwright.yml        # CI pipeline
├── docs/
│   └── test-plan.md          # Test strategy document
├── helpers/
│   ├── api-client.ts         # Auth token manager
│   └── test-data.ts          # Booking data factories
├── tests/
│   ├── health.spec.ts        # Health check
│   ├── auth.spec.ts          # Authentication
│   ├── booking-crud.spec.ts  # Full CRUD lifecycle
│   └── booking-search.spec.ts # Search & filter
├── types/
│   └── booking.ts            # TypeScript interfaces for API responses
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/restful-booker-api-tests.git
cd restful-booker-api-tests

# Install dependencies
npm ci

# Run all tests
npx playwright test

# Open the HTML test report
npx playwright show-report
```

> **Note:** No browser installation needed — these are pure API tests using Playwright's request context.

### Debug

```bash
# Step through tests in the Playwright Inspector
npx playwright test --debug
```

## CI/CD

Tests run automatically on every push and pull request to `main`. The workflow:

1. Checks out code & installs Node.js
2. Installs dependencies
3. Runs the API tests
4. Uploads the HTML report as an artifact (30-day retention)

## API Under Test

| Endpoint | Method | Auth Required | Description |
|----------|--------|:---:|-------------|
| `/ping` | GET | No | Health check (returns 201) |
| `/auth` | POST | No | Create auth token |
| `/booking` | GET | No | List booking IDs (filterable) |
| `/booking/:id` | GET | No | Get single booking |
| `/booking` | POST | No | Create booking |
| `/booking/:id` | PUT | Yes | Full update |
| `/booking/:id` | PATCH | Yes | Partial update |
| `/booking/:id` | DELETE | Yes | Delete booking |

## Design Decisions

- **No browser install** — Playwright's `APIRequestContext` handles HTTP natively. Faster CI, smaller footprint.
- **Sequential execution** — CRUD tests depend on each other (create → read → update → delete). Set `fullyParallel: false` and `workers: 1`.
- **TypeScript interfaces** — Response shapes are defined in `types/booking.ts`, giving compile-time validation and autocomplete.
- **Self-cleaning tests** — Each test run creates and deletes its own data to avoid conflicts on the shared public API.

## What I Learned

- Using Playwright as an API testing tool (not just browser automation)
- Token-based API authentication with cookie headers
- Structuring tests for dependent CRUD operations
- Writing TypeScript interfaces for schema validation
- Creating a test plan document for QA documentation skills

## License

MIT
