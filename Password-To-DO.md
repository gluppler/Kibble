
---

# 🛠️ **Password Reset System (No Email) — To-Do List**

## 1. **MFA-Based Password Reset**

* [ ] Add **“Forgot Password”** entry point on login page.
* [ ] Prompt user to enter **registered email** to identify account.
* [ ] Check if user has **MFA enabled**:

  * [ ] If yes → prompt for **TOTP code**.
  * [ ] Validate TOTP using stored MFA secret.
* [ ] If TOTP correct → allow user to **enter a new password**.
* [ ] After password update:

  * [ ] Invalidate all active sessions.
  * [ ] Refresh MFA tokens if needed.
  * [ ] Log reset event for audit purposes.

---

## 2. **Recovery Code Password Reset**

* [ ] During MFA setup, **generate recovery codes** for each user.
* [ ] Store recovery codes **hashed** in DB.
* [ ] Allow password reset using **one recovery code** if TOTP unavailable.
* [ ] Invalidate **used recovery code** immediately after reset.
* [ ] Optionally: generate new set of recovery codes after reset.
* [ ] After password update:

  * [ ] Invalidate all active sessions.
  * [ ] Log reset event for audit purposes.

---

## 3. **No MFA / No Recovery Codes Case**

* [ ] Detect if user has **no MFA + no recovery codes**.
* [ ] Display clear message:

  > “Password cannot be reset because no MFA or recovery codes exist. Please create a new account.”
* [ ] Prevent any insecure fallback methods (security questions, plain tokens, etc.)

---

## 4. **Frontend / UX Considerations**

* [ ] Separate “Forgot Password” page with clear instructions.
* [ ] Input field for **registered email**.
* [ ] Input field for **TOTP code** or **recovery code** (dynamic depending on availability).
* [ ] Input field for **new password** and **confirm password**.
* [ ] Show validation errors inline (invalid TOTP/recovery code, password strength, token expired).
* [ ] Optional: show countdown for recovery code validity.

---

## 5. **Backend / Security Requirements**

* [ ] Store MFA secrets securely (encrypted if possible).
* [ ] Store recovery codes hashed.
* [ ] Enforce **rate limiting** for reset attempts.
* [ ] Invalidate all existing sessions after password reset.
* [ ] Log all password reset events for auditing.
* [ ] Ensure no user enumeration: always return generic messages like:

  > “If an account exists, reset steps will continue.”

---

## 6. **Testing & Edge Cases**

* [ ] Test reset with **valid MFA code**.
* [ ] Test reset with **valid recovery code**.
* [ ] Test reset with **expired/invalid MFA code**.
* [ ] Test reset with **expired/invalid recovery code**.
* [ ] Test reset when **no MFA / no recovery codes exist**.
* [ ] Test session invalidation after password change.
* [ ] Test logging for all reset events.
* [ ] Test multiple users simultaneously.

---

