Below is **SECURITY-LAWS.md**, written in the same style, structure, and tone as your **UX-LAWS.md** file, but this time focused on **secure coding**, **OWASP principles**, and **proper MFA practices**—including **NextAuth MFA integration guidelines**.
This is drop-in ready for your repo.

---

# 🔐 SECURITY LAWS :: SECURE CODING & MFA PRINCIPLES

*A comprehensive collection of foundational security principles, inspired by OWASP Secure Coding Practices, modern MFA requirements, and practical auth design.*

**Sources:**

* OWASP Secure Coding Practices – Quick Reference Guide
* OWASP ASVS 4.0
* NIST 800-63B
* RFC 8252 (OAuth 2.0 Security for Native Apps)

---

# 📚 CATEGORIES

Security principles are organized into five main domains:

1. **Authentication & MFA**
2. **Authorization & Access Control**
3. **Data Validation & Input Handling**
4. **Session & Token Security**
5. **Infrastructure + Application Hardening**

---

# 🧱 FOUNDATION: OWASP CORE PRINCIPLES

---

## 1. **Least Privilege & Zero Trust**

**Principle:** Every component, user, API, and internal function should have the minimum permissions required—nothing more.

**Application:**

* No admin-by-default accounts
* No powerful API tokens on frontend
* Use fine-grained RBAC
* Never trust session state stored client-side

**For Kibble:**

```ts
// API routes: narrow scope
if (!session?.user?.roles?.includes("admin")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

---

## 2. **Defense in Depth**

**Principle:** Security should be layered. If one control fails, others still protect the system.

**Application:**

* WAF + rate limiting + MFA + session rotation
* Secure cookies + JWT validity checks
* Validate input server-side even if validated client-side

**For Kibble:**

```ts
// API routes wrapped with:
// - Rate limiter
// - Session validation
// - Payload schema validation
```

---

## 3. **Secure by Default**

**Principle:** Defaults must be the safest option. Opt-in for dangerous capabilities.

**Application:**

* Default deny firewall
* Default secure cookie flags
* Default MFA opt-in shown on onboarding

**For Kibble:**

```ts
cookies.set("session", token, {
  httpOnly: true,
  secure: true,
  sameSite: "strict"
})
```

---

## 4. **Fail Securely**

**Principle:** When something breaks, the system must fail *closed*, not open.

**Application:**

* Don’t reveal sensitive error messages
* “Access denied” > “User not found”
* Token validation failures log internally but return generic errors

---

## 5. **Separation of Duties**

**Principle:** No single system/component should have full power. Split authority.

**Application:**

* Server handles auth
* Client only triggers flows
* Database users separated (read vs write)

---

# 🔑 AUTHENTICATION & MFA PRINCIPLES

---

## 6. **Passwordless First (Modern Best Practice)**

**Principle:** The most secure credential is one the user never types.

**Application:**

* WebAuthn
* Passkeys
* Magic links
* OAuth Device Code

**For Kibble + NextAuth:**

```ts
import { WebAuthnFeature } from "@auth/webauthn"
```

---

## 7. **Strong MFA (NIST 800-63B Compliant)**

**Valid MFA Factors:**

* 🔐 Something you **have** → TOTP (Authy, Google Authenticator), WebAuthn keys
* 👆 Something you **are** → Device biometrics
* 🔑 Something you **know** → Password or PIN

**Invalid or weak factors:**

* ❌ SMS
* ❌ Email OTP
* ❌ Security questions

**Use for Kibble:**
✔ TOTP (primary recommendation)
✔ WebAuthn + Passkeys
✔ FIDO2 security keys

---

## 8. **MFA Must Bind to the User Session**

**Principle:** MFA is meaningless unless tied to session authentication state.

**Application:**

* MFA challenge required before generating JWT/session
* Re-challenge for sensitive operations (role changes, API tokens)

---

## 9. **MFA Recovery Codes**

**Principle:** Loss of authenticator ≠ locked out forever.
Provide **one-way hashed** recovery codes.

**For Kibble:**

```ts
// hashed with bcrypt
const hashed = await bcrypt.hash(code, 12)
```

---

## 10. **NextAuth MFA Integration – Required Rules**

These are *practical and strict* guidelines for real-world implementation:

### **A. Enroll MFA AFTER initial login**

```tsx
if (!session.user.mfaEnabled) {
  redirect("/mfa/setup")
}
```

### **B. Store MFA secrets SERVER-SIDE ONLY**

Never send TOTP secret back to the browser after initial QR generation.

### **C. Don't store TOTP secrets in plain text**

Use encryption or Argon2id-hashed secrets where possible.

### **D. MFA challenge must happen BEFORE issuing session cookies**

```mermaid
flowchart LR
Login --> Verify Password --> Trigger MFA --> Success --> Create Session
```

### **E. MFA must live in its own auth step**

NextAuth `callbacks.signIn`:

```ts
if (user.mfaEnabled && !accountTwoFactorPassed) {
  throw new Error("MFA_REQUIRED")
}
```

---

## 11. **Never Mix MFA Logic With Conventional Routes**

**Principle:** MFA routes must be isolated and hardened.
Structure:

* `/mfa/setup`
* `/mfa/confirm`
* `/mfa/disable`
* `/mfa/challenge`
* `/mfa/recovery`

---

# 🛂 AUTHORIZATION & ACCESS CONTROL

---

## 12. **Deny by Default**

**Principle:** Access is granted only with explicit allow rules.

**For Kibble:**

```ts
if (!session) return forbidden()
```

---

## 13. **Server-Side Authorization Only**

**Principle:** Never rely on the frontend to validate user permissions.

**Bad:**

```tsx
if (user.role === "admin") {
  showAdminButton()
}
```

**Good:**

```ts
if (!session.user.roles.includes("admin")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

---

## 14. **Horizontal Access Control (IDOR Prevention)**

Rules:

* Always verify resource ownership
* Never trust URL parameters

**For Kibble:**

```ts
const board = await db.board.findUnique({
  where: { id: params.id, userId: session.user.id }
})
```

---

# 🧹 DATA VALIDATION & INPUT SECURITY

---

## 15. **Strict Input Validation**

**Principle:** All input must be treated as potentially malicious.

Use:

* Zod (recommended)
* Joi
* Yup

**For Kibble:**

```ts
const schema = z.object({
  title: z.string().max(200),
  description: z.string().max(2000).optional(),
})
```

---

## 16. **Validate EVERYTHING on the Server**

Client-side validation = UX
Server-side validation = Security

Always do both.

---

## 17. **Canonicalization Before Use**

Normalize input before validation:

* Trim
* Lowercase email
* Remove null bytes
* Normalize Unicode

---

# 🔑 SESSION & TOKEN SECURITY

---

## 18. **Secure Cookies Only**

**Rules:**

* `httpOnly`
* `secure`
* `sameSite=strict`
* Avoid localStorage for auth data

---

## 19. **Short Token Lifetimes + Rotation**

**Principle:** Rotate session tokens after:

* Login
* MFA verification
* Password change
* Role update

---

## 20. **JWT Best Practices (If You Use JWT)**

* Never store PII inside JWT
* Always verify signature server-side
* Prefer short-lived (minutes) access tokens
* Prefer long-lived httpOnly refresh tokens

---

# 🛡️ INFRASTRUCTURE & APP HARDENING

---

## 21. **Rate Limiting Everywhere**

Protect:

* Login
* MFA challenge
* Signup
* Password reset
* Any public endpoint

---

## 22. **Secrets & Environment Security**

* Use `.env` but never commit it
* Use Doppler, 1Password, Vault, AWS Secrets Manager
* Rotate all secrets regularly

---

## 23. **Error Handling Must Be Generic**

No:

* “Invalid password for user X”

Yes:

* "Invalid credentials"

---

## 24. **Secure Logging**

Log:

* Auth attempts
* Suspicious IP behavior
* MFA failures

Don’t log:

* Passwords
* Tokens
* TOTP secrets
* Recovery codes

---

# 🔌 NEXTAUTH MFA CHECKLIST (Complete)

### **Enrollment**

* [ ] User logs in normally
* [ ] User is forced to `/mfa/setup`
* [ ] TOTP secret generated server-side
* [ ] QR served once
* [ ] Secret stored encrypted
* [ ] User enters 6-digit code
* [ ] Recovery codes generated
* [ ] `mfaEnabled = true`

### **Login Flow**

* [ ] Password/primary login
* [ ] Detect `mfaEnabled`
* [ ] Redirect to `/mfa/challenge`
* [ ] Validate TOTP or WebAuthn
* [ ] Rotate session token
* [ ] Redirect to app

### **Recovery**

* [ ] One-way hashed codes
* [ ] Single-use
* [ ] Rotatable

### **Sensitive Actions**

Require re-auth:

* Changing email
* Disabling MFA
* Generating API keys
* Changing roles

---

# 📚 REFERENCES

* OWASP Secure Coding Practices
* OWASP ASVS Level 2 Controls
* NIST 800-63B Authentication Guidelines
* WebAuthn & FIDO2 Specs
* NextAuth Security Docs

---

# 🧾 END OF SECURITY LAWS

**Last Updated:** November 2025
**Application:** Kibble Secure Auth Design

```
▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜
▌  SECURITY LAWS LOADED                 ▐
▌  Build systems that assume attacks    ▐
▌  Protect users without burdening them ▐
▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟
```

---


