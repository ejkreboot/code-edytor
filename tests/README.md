# CodeEdytor End-to-End Tests

This directory contains Playwright tests for the CodeEdytor component library.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Structure

- `codeedytor.spec.js` - Main component tests covering:
  - Basic component rendering
  - Typing and input handling
  - Two-way binding functionality
  - Callback demonstration
  - External updates
  - Completion system
  - Line numbers

## Recording New Tests

Use Playwright's codegen to record new tests:

```bash
# Record tests against the running dev server
npx playwright codegen http://localhost:5173

# Record tests for a specific browser
npx playwright codegen --browser=firefox http://localhost:5173
```

## Test Coverage

The tests cover:
- ✅ Component initialization and rendering
- ✅ User input and typing
- ✅ Two-way binding (`bind:value`)
- ✅ Callback props (`oninput`, `onchange`, etc.)
- ✅ External code updates
- ✅ Completion system (ghost text)
- ✅ Line numbers display
- ✅ Multi-language support (R, Python, JavaScript)

## Configuration

See `playwright.config.js` for configuration details. The tests:
- Run against Chrome, Firefox, and Safari
- Start the dev server automatically
- Take screenshots and videos on failure
- Generate HTML reports