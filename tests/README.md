# Test Cases for Authentication

## Overview

This document describes the test cases for the authentication and board creation flow.

## Automated Tests

Run the test file `auth.test.ts` using a test runner like Jest or Vitest.

```bash
# Install test dependencies (if not already installed)
npm install -D jest @types/jest ts-jest

# Run tests
npm test
```

## Manual Test Checklist

### 1. User Registration ✅

**Steps:**
1. Navigate to `http://localhost:3000/auth/signin`
2. Click "create a new account" link
3. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123" (min 6 characters)
4. Click "Create account"

**Expected Results:**
- ✅ User is registered successfully
- ✅ Automatically logged in
- ✅ Redirected to home page (`/`)
- ✅ Board appears with 4 columns:
  - To-Do
  - In-Progress
  - Review
  - Done
- ✅ All columns are empty (no tasks)

### 2. User Login ✅

**Steps:**
1. Sign out (click "Sign Out" button)
2. Navigate to `/auth/signin`
3. Enter registered email and password
4. Click "Sign in"

**Expected Results:**
- ✅ User is logged in successfully
- ✅ Redirected to home page
- ✅ Board loads with previously created columns
- ✅ User email displayed in top right

### 3. Authentication Protection ✅

**Steps:**
1. Sign out
2. Try to access `http://localhost:3000/` directly
3. Try to access `http://localhost:3000/api/boards` directly

**Expected Results:**
- ✅ Redirected to `/auth/signin` when accessing `/`
- ✅ API returns 401 Unauthorized for protected routes

### 4. Error Handling ✅

**Test Case 4a: Duplicate Email Registration**
- Try to register with an email that already exists
- ✅ Should show error: "User with this email already exists"

**Test Case 4b: Invalid Login**
- Try to login with wrong password
- ✅ Should show error: "Invalid email or password"

**Test Case 4c: Missing Fields**
- Try to register without email or password
- ✅ Should show validation error

### 5. Board Creation on Registration ✅

**Steps:**
1. Register a new user
2. Check the board that was created

**Expected Results:**
- ✅ Board is created automatically
- ✅ Board has exactly 4 columns
- ✅ Column names are: "To-Do", "In-Progress", "Review", "Done"
- ✅ Columns are in correct order (0, 1, 2, 3)
- ✅ Board is linked to the user (userId matches user.id)

### 6. Session Persistence ✅

**Steps:**
1. Login
2. Refresh the page (F5)
3. Close and reopen browser tab

**Expected Results:**
- ✅ User remains logged in after refresh
- ✅ Board persists and loads correctly
- ✅ Session persists across browser tabs (if using same browser)

### 7. Sign Out ✅

**Steps:**
1. While logged in, click "Sign Out" button
2. Try to access `/` after signing out

**Expected Results:**
- ✅ User is signed out
- ✅ Redirected to `/auth/signin`
- ✅ Cannot access protected routes

## Test Data

Use these test accounts for manual testing:

```
Email: test1@example.com
Password: test123

Email: test2@example.com
Password: test123
```

## API Endpoints to Test

### Registration
```bash
POST /api/auth/register
Body: { "name": "Test", "email": "test@example.com", "password": "test123" }
Expected: 201 Created with user and board data
```

### Login (via NextAuth)
```bash
POST /api/auth/signin
Body: { "email": "test@example.com", "password": "test123" }
Expected: 200 OK with session cookie
```

### Get User Board (Protected)
```bash
GET /api/boards/user
Headers: Cookie: next-auth.session-token=...
Expected: 200 OK with board data
```

### Create Board (Protected)
```bash
POST /api/boards
Headers: Cookie: next-auth.session-token=...
Body: { "title": "My Board" }
Expected: 201 Created with board data
```

## Notes

- All passwords should be hashed using bcrypt
- Sessions use JWT strategy
- Boards are automatically created on user registration
- Each user can have multiple boards (future feature)
- Board columns are created with the exact names: "To-Do", "In-Progress", "Review", "Done"
