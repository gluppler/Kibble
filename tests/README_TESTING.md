# Automated Testing Guide for Kibble

## Overview

This project uses **Vitest** as the testing framework for automated unit and integration tests.

## Test Setup

### Installation

All testing dependencies are already installed:
- `vitest` - Test runner
- `@vitest/ui` - Test UI
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for tests

### Configuration

- **Config File:** `vitest.config.ts`
- **Setup File:** `tests/setup.ts` (mocks Next.js and NextAuth)

## Running Tests

### Basic Commands

```bash
# Run tests in watch mode (default)
npm test

# Run tests once and exit
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Running Specific Tests

```bash
# Run a specific test file
npm test tests/task-persistence.test.ts

# Run tests matching a pattern
npm test -- --grep "Task Creation"

# Run tests in a specific directory
npm test tests/
```

## Test Files

### 1. `task-persistence.test.ts`
**Purpose:** Tests task persistence, dragging, and locking behavior

**Coverage:**
- Task creation and persistence
- Task dragging and column movement
- Task locking logic
- Optimistic update logic
- Column order persistence
- Edge cases

**Test Count:** 19 tests

### 2. `api-tasks.test.ts`
**Purpose:** Tests task API endpoint logic

**Coverage:**
- POST /api/tasks validation
- PATCH /api/tasks/[id] logic
- DELETE /api/tasks/[id] logic
- Error handling
- Authorization checks

**Test Count:** 16 tests

### 3. `column-behavior.test.ts`
**Purpose:** Tests column behavior and ordering

**Coverage:**
- Column order sorting
- Column reordering logic
- Column validation
- Column-task relationships

**Test Count:** 10 tests

### 4. `auth.test.ts`
**Purpose:** Tests authentication logic

**Coverage:**
- User registration validation
- Board creation logic
- Session management
- Authorization checks
- Password security

**Test Count:** 15+ tests

## Test Structure

### Example Test

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = someFunction();
    expect(result).toBe(expectedValue);
  });
});
```

## Writing New Tests

### 1. Create Test File

Create a new file in `tests/` directory:
```bash
touch tests/my-feature.test.ts
```

### 2. Import Dependencies

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
```

### 3. Write Tests

```typescript
describe('My Feature', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should test something', () => {
    // Test implementation
    expect(actual).toBe(expected);
  });
});
```

## Test Coverage

### View Coverage Report

```bash
npm run test:coverage
```

This generates:
- Console report
- HTML report in `coverage/` directory
- JSON report for CI/CD

### Coverage Goals

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

## Best Practices

### 1. Test Naming
- Use descriptive test names
- Follow pattern: "should [expected behavior]"
- Group related tests in `describe` blocks

### 2. Test Isolation
- Each test should be independent
- Use `beforeEach` for setup
- Clean up after tests

### 3. Assertions
- Use specific matchers (`toBe`, `toEqual`, `toContain`)
- Test both positive and negative cases
- Test edge cases

### 4. Mocking
- Mock external dependencies
- Mock API calls
- Mock Next.js router and navigation

### 5. Performance
- Keep tests fast (< 100ms each)
- Avoid unnecessary setup
- Use `vi.fn()` for simple mocks

## Debugging Tests

### Run Single Test

```bash
npm test -- tests/task-persistence.test.ts -t "should create task"
```

### Debug Mode

```bash
npm test -- --inspect-brk
```

### Verbose Output

```bash
npm test -- --reporter=verbose
```

## Common Issues

### Issue: Tests fail with "Cannot find module"
**Solution:** Check `vitest.config.ts` paths alias configuration

### Issue: Mock not working
**Solution:** Ensure mocks are in `tests/setup.ts` or use `vi.mock()` in test file

### Issue: Tests timeout
**Solution:** Increase timeout or check for infinite loops

## Next Steps

1. **Add Component Tests:** Test React components with `@testing-library/react`
2. **Add E2E Tests:** Use Playwright or Cypress for end-to-end testing
3. **Add Integration Tests:** Test API endpoints with test database
4. **Add Visual Regression Tests:** Use tools like Percy or Chromatic

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)
