# E2E Tests - RiseCheckout

**RISE ARCHITECT PROTOCOL V3 - 10.0/10**

This directory contains end-to-end tests for the RiseCheckout platform using Playwright.

## Architecture

```
e2e/
├── fixtures/
│   ├── test-data.ts          # Centralized test data and constants
│   └── pages/                # Page Object classes
│       ├── AuthPage.ts       # Producer authentication page
│       ├── CadastroPage.ts   # Producer registration page
│       ├── LandingPage.ts    # Landing page
│       ├── CheckoutPage.ts   # Public checkout page
│       ├── PixPaymentPage.ts # PIX payment page
│       ├── SuccessPage.ts    # Payment success page
│       └── BuyerPage.ts      # Buyer area pages
├── specs/                    # Test specifications (Single Responsibility)
│   ├── smoke.spec.ts             # Smoke tests (critical routes)
│   ├── auth.spec.ts              # Producer authentication tests
│   ├── checkout-loading.spec.ts  # Checkout page loading tests
│   ├── checkout-form.spec.ts     # Checkout form validation tests
│   ├── checkout-payment.spec.ts  # Payment method selection tests
│   ├── checkout-bumps.spec.ts    # Order bump tests
│   ├── checkout-submit.spec.ts   # Submit flow and success tests
│   ├── landing.spec.ts           # Landing page tests
│   └── buyer-auth.spec.ts        # Buyer authentication tests
├── members-area-flicker.spec.ts  # Flicker fix validation tests
└── README.md                     # This file
```

## Page Object Pattern

All page interactions are encapsulated in Page Object classes located in `fixtures/pages/`. This pattern provides:

- **Maintainability**: Changes to UI selectors only need to be updated in one place
- **Reusability**: Page objects can be shared across multiple test files
- **Readability**: Tests read like user stories

### Example Usage

```typescript
import { AuthPage } from "../fixtures/pages/AuthPage";

test("should login successfully", async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.navigate();
  await authPage.login("user@example.com", "password123");
  await authPage.waitForLoginComplete();
});
```

## Running Tests

```bash
# Run all E2E tests
pnpm exec playwright test

# Run specific test file
pnpm exec playwright test e2e/specs/auth.spec.ts

# Run tests with UI mode
pnpm exec playwright test --ui

# Run tests headed (see the browser)
pnpm exec playwright test --headed

# Run tests in debug mode
pnpm exec playwright test --debug
```

## Test Categories

### Smoke Tests (`smoke.spec.ts`)
Fast tests that verify critical routes load without errors:
- Landing page
- Auth page
- Registration page
- Password recovery
- Terms of use
- Checkout error handling
- Buyer login

### Auth Tests (`auth.spec.ts`)
Producer authentication flow tests:
- Login form display
- Email validation
- Password validation
- Invalid credentials handling
- Navigation to registration
- Navigation to password recovery

### Checkout Tests (Modularized - Single Responsibility)

| File | Responsibility |
|------|---------------|
| `checkout-loading.spec.ts` | Page loading, invalid slug handling |
| `checkout-form.spec.ts` | Customer form validation |
| `checkout-payment.spec.ts` | Payment methods and coupon system |
| `checkout-bumps.spec.ts` | Order bump display and toggle |
| `checkout-submit.spec.ts` | Form submission and success page |

### Landing Tests (`landing.spec.ts`)
Landing page tests:
- Hero section display
- Header navigation
- Footer display
- CTA buttons
- Scroll behavior
- Responsive design

### Buyer Auth Tests (`buyer-auth.spec.ts`)
Buyer authentication tests:
- Login form display
- Form validation
- Invalid credentials
- Setup access flow
- Access control

## Test Data

All test data is centralized in `fixtures/test-data.ts`:

- `TEST_CREDENTIALS`: Static test credentials for various scenarios
- `TEST_CHECKOUT`: Checkout-specific test data (slugs, coupons)
- `TEST_SELECTORS`: Centralized data-testid selectors
- `ROUTES`: All application routes
- `TIMEOUTS`: Standard timeout values
- `ERROR_MESSAGES`: Expected error message patterns

## Best Practices

1. **Use Page Objects**: Never write raw selectors in test files
2. **Wait for States**: Use `waitFor*` methods instead of arbitrary timeouts
3. **Isolate Tests**: Each test should be independent
4. **Clear Assertions**: Use descriptive assertion messages
5. **Handle Variability**: Account for optional UI elements
6. **Single Responsibility**: Each spec file tests one specific domain

## Adding New Tests

1. Create or update the relevant Page Object in `fixtures/pages/`
2. Add test data to `fixtures/test-data.ts` if needed
3. Create test specs in `specs/` following naming convention: `*.spec.ts`
4. Follow the Page Object Pattern for all page interactions
5. Keep each file under 300 lines (RISE V3 requirement)

## CI/CD Integration

Tests are configured to run in CI via GitHub Actions. See `.github/workflows/` for configuration.

## Debugging

```bash
# Generate trace for failed tests
pnpm exec playwright test --trace on

# View trace
pnpm exec playwright show-trace trace.zip

# Screenshot on failure (enabled by default)
pnpm exec playwright test --screenshot on
```
