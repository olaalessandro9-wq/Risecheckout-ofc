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
├── specs/                    # Test specifications
│   ├── smoke.spec.ts         # Smoke tests (critical routes)
│   ├── auth.spec.ts          # Producer authentication tests
│   ├── checkout.spec.ts      # Public checkout tests
│   ├── landing.spec.ts       # Landing page tests
│   └── buyer-auth.spec.ts    # Buyer authentication tests
├── members-area-flicker.spec.ts  # Legacy flicker fix tests
└── README.md                 # This file
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

### Checkout Tests (`checkout.spec.ts`)
Public checkout flow tests:
- Invalid slug handling
- Form validation
- Coupon system
- Payment method selection
- Order bumps
- Submit flow
- Success page

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

## Adding New Tests

1. Create or update the relevant Page Object in `fixtures/pages/`
2. Add test data to `fixtures/test-data.ts` if needed
3. Create test specs in `specs/` following naming convention: `*.spec.ts`
4. Follow the Page Object Pattern for all page interactions

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
