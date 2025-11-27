
---

# ✅ **KIBBLE — Full To-Do Tasks List (Updated)**

*A complete and essential development checklist for long-term maintainability.*

---

# 1. **UI/UX Redesign (Black & White Minimal System)**

### 🎨 **Design Requirements**

* [ ] Enforce a **strict black & white** color scheme (no colors, no gradients).
* [ ] Typography: **Inter Bold** for headings, Inter Regular/Medium for body text.
* [ ] Remove flashy designs, patterns, and unnecessary decoration.
* [ ] Replace all colors with grayscale or pure black/white components.
* [ ] Simplify component layout using spacing, alignment, and whitespace discipline.
* [ ] Add consistent border radiuses (minimal or square).
* [ ] High contrast text (black on white or white on black).

### 🧭 **UX Improvements**

* [ ] Improve task creation flow (fewer clicks, clearer modal).
* [ ] Add proper empty states for boards and categories.
* [ ] Add loading states, skeletons, and optimistic interactions.
* [ ] Add error messages, validation feedback, and inline form warnings.
* [ ] Improve drag-and-drop visual clarity across Kanban columns.

---

# 2. **Feature Polish: Class-Based Task Categories (Kanban System)**

* [ ] Review entire Class/Subject → Board architecture.
* [ ] Clean up board creation logic.
* [ ] Verify tasks display correctly in their respective Kanban columns.
* [ ] Ensure board permissions and access rules are enforced.
* [ ] Run test cases for:

  * [ ] Board creation
  * [ ] Task creation
  * [ ] Drag-and-drop
  * [ ] User-specific visibility
  * [ ] Editing/deleting tasks
  * [ ] Completing tasks
* [ ] Refactor only after tests pass consistently.

---

# 3. **Due Date Alerts (Real-Time Client Alerts)**

### 🔔 **Core Requirements**

Use browser APIs: `setInterval`, `Notification API`, `Visibility API`, or local timers.

* [ ] Implement countdown logic for each task.
* [ ] Alerts must automatically update in real time.
* [ ] When due date is:

  * 🔴 **10 days or less away → RED alert**
  * 🔴 **1 day away → Strong RED warning**
* [ ] When a task is moved to **Done**, trigger a **GREEN congratulatory alert**.
* [ ] Each alert must be dismissible by the user.
* [ ] Add background tab detection to avoid unnecessary CPU usage.
* [ ] Add expiration cleanup so old alerts do not persist.

---

# 4. **Authentication, MFA, and Password Reset System**

### 🔐 **Account Model (You already require name, email, password)**

Since registration requires email, you *must* support email-based verification + reset.

### 👤 **Email Requirements (Even Without a Business Email Account)**

You can use:

* Resend
* Mailersend
* Mailgun free tier
* SendGrid free tier
* Vercel + Resend (recommended)

### 🔐 **MFA (TOTP-based, no passkeys)**

* [ ] Add TOTP MFA (e.g., using `otplib`).
* [ ] Include QR code generation.
* [ ] Include backup recovery codes.
* [ ] Add MFA requirement on login if enabled.
* [ ] Allow disabling MFA with password confirmation.

### 🔄 **Forgot Password (Edge Case Coverage)**

User provides email →

* [ ] Generate a **time-limited reset token**.
* [ ] Email them a reset link (valid for 10–30 minutes).
* [ ] If link is expired → explain and regenerate.
* [ ] If token invalid → refuse and ask for new reset.
* [ ] After reset → revoke all sessions and MFA tokens (security).

Edge cases to handle:

* [ ] Email not found → return a generic success response for security.
* [ ] User has MFA active → require MFA after password reset OR invalidate MFA and require re-setup.
* [ ] Prevent token reuse.
* [ ] Rate-limit reset attempts.
* [ ] Lock account if too many reset requests from same IP.

---

# 5. **Permissions System (Full Hardening)**

* [ ] Add user roles: owner, regular user, read-only (optional).
* [ ] Add board-level access controls.
* [ ] Validate permissions server-side for every board/task API route.
* [ ] Add tests for permission failures.
* [ ] Improve error handling for unauthorized access.
* [ ] Add logging for security events (deletes, resets, MFA toggles).

---

# 6. **Local Deployment, Environment Setup, and Safe Release Workflow**

### 🖥️ **Local Development & Local Deployment (Primary Focus)**

* [ ] Set up isolated **local environment** for dev + testing.
* [ ] Configure `.env.local` with DB credentials, JWT secrets, MFA secrets.
* [ ] Set up **local Postgres** (Docker or direct).
* [ ] Migrate schema locally via Prisma.
* [ ] Create local seed script with mock users, subjects, and boards.
* [ ] Test MFA locally with TOTP apps.
* [ ] Test password reset links using localhost URLs.
* [ ] Test permission logic across multiple local accounts.
* [ ] Test rate limiting and brute-force protections locally.
* [ ] Add local logging/debugging tools.

### 🔁 **Local “Release Candidate” Build**

* [ ] Run `next build` and `next start` to test production mode locally.
* [ ] Verify UI/UX, task flow, and alert system in prod mode.
* [ ] Stress-test under heavy loads.

### 🧪 **Local QA Before Cloud Deployment**

* [ ] Test on multiple browsers and screen sizes.
* [ ] Validate accessibility (contrast, tab order, screen readers).
* [ ] Test errors, missing variables, failed connections.
* [ ] Check all auth flows again in production mode locally.

### ☁️ **Optional Cloud Deployment (Only After Local Stability)**

* [ ] Prepare `.env.production` separately.
* [ ] Migrate production DB safely.
* [ ] Deploy to Vercel only after full local sign-off.
* [ ] Re-test password reset, MFA, alerts, and boards in production.

---

# 7. **Database Cleanup & Schema Stability**

* [ ] Remove unused tables and models.
* [ ] Clean redundant demo data.
* [ ] Add Prisma schema documentation.
* [ ] Add indexes for due dates, task updates, per-user lookups.
* [ ] Add foreign key constraints and cascading deletes.
* [ ] Run test migrations to ensure schema safety.

---

# 8. **Documentation & Repo Cleanup**

* [ ] Rewrite README with clear structure.
* [ ] Add architecture diagrams (auth, alerts, Kanban flow).
* [ ] Add instructions for local install → local testing → local production.
* [ ] Add comments for complex parts of the codebase.
* [ ] Add contribution guidelines.

---


