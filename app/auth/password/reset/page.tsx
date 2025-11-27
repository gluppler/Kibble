/**
 * MFA-Based Password Reset Page Component
 * 
 * Allows users to reset their password using MFA (TOTP or recovery code).
 * 
 * Security Features:
 * - Validates email and checks MFA status
 * - Prompts for TOTP code or recovery code based on availability
 * - Enforces password strength requirements
 * - Shows error if no MFA/recovery codes exist
 * - Revokes all sessions after reset
 * - Invalidates MFA after reset
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Shield, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import Link from "next/link";
import { logError } from "@/lib/logger";

type ResetStep = "email" | "code" | "password" | "success" | "error";

function PasswordResetForm() {
  const router = useRouter();

  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeType, setCodeType] = useState<"totp" | "recovery">("totp");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMFA, setHasMFA] = useState(false);
  const [hasRecoveryCodes, setHasRecoveryCodes] = useState(false);
  const [canReset, setCanReset] = useState(false);

  // Step 1: Check email and MFA status
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to check account status");
        setLoading(false);
        return;
      }

      setHasMFA(data.hasMFA || false);
      setHasRecoveryCodes(data.hasRecoveryCodes || false);
      setCanReset(data.canReset || false);

      if (!data.canReset) {
        // No MFA or recovery codes - show error
        setStep("error");
        setError(
          "Password cannot be reset because no MFA or recovery codes exist. Please create a new account."
        );
        setLoading(false);
        return;
      }

      // Proceed to code entry step
      setStep("code");
      setCodeType(data.hasMFA ? "totp" : "recovery");
      setLoading(false);
    } catch (err) {
      logError("Error checking account status:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Step 2: Verify code and proceed to password reset
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || code.trim().length === 0) {
      setError("Please enter a code");
      return;
    }

    // Validate code format based on type
    if (codeType === "totp") {
      if (!/^\d{6}$/.test(code)) {
        setError("TOTP code must be 6 digits");
        return;
      }
    } else {
      const normalizedCode = code.toUpperCase().trim();
      if (!/^[0-9A-F]{8}$/.test(normalizedCode)) {
        setError("Recovery code must be 8 hexadecimal characters");
        return;
      }
    }

    // Proceed to password entry
    setStep("password");
  };

  // Step 3: Reset password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: codeType === "recovery" ? code.toUpperCase().trim() : code,
          codeType,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      // Success - show success message and redirect
      setStep("success");
      setLoading(false);

      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (err) {
      logError("Error resetting password:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Error state (no MFA/recovery codes)
  if (step === "error") {
    return (
      <div className="min-h-screen-responsive flex items-center justify-center bg-white dark:bg-black px-3 sm:px-4 w-full py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-md w-full space-y-4 sm:space-y-6 bg-white dark:bg-black p-4 sm:p-6 md:p-8 rounded-lg border border-black/10 dark:border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <AlertCircle className="text-white dark:text-black" size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">
                Cannot Reset Password
              </h2>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold mt-1">
                No MFA or recovery codes found
              </p>
            </div>
          </div>

          <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
            <p className="text-sm text-black dark:text-white font-bold mb-4">
              {error ||
                "Password cannot be reset because no MFA or recovery codes exist. Please create a new account."}
            </p>
            <p className="text-xs text-black/60 dark:text-white/60 font-bold">
              For security reasons, password reset requires MFA or recovery codes. If you don't have these set up, you'll need to create a new account.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStep("email");
                setError("");
                setEmail("");
              }}
              className="flex-1 px-4 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity text-sm font-bold"
            >
              Try Again
            </button>
            <Link
              href="/auth/signin"
              className="flex-1 text-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-sm font-bold"
            >
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <div className="min-h-screen-responsive flex items-center justify-center bg-white dark:bg-black px-3 sm:px-4 w-full py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-md w-full space-y-4 sm:space-y-6 bg-white dark:bg-black p-4 sm:p-6 md:p-8 rounded-lg border border-black/10 dark:border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <CheckCircle2 className="text-white dark:text-black" size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">
                Password Reset Successful
              </h2>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold mt-1">
                Your password has been reset
              </p>
            </div>
          </div>

          <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
            <p className="text-sm text-black dark:text-white font-bold mb-2">
              Your password has been successfully reset.
            </p>
            <p className="text-xs text-black/60 dark:text-white/60 font-bold">
              All your sessions have been revoked for security. You'll be redirected to sign in shortly.
            </p>
          </div>

          <Link
            href="/auth/signin"
            className="block w-full text-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-sm font-bold"
          >
            Sign In Now
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-responsive flex items-center justify-center bg-white dark:bg-black px-3 sm:px-4 w-full py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-md w-full space-y-4 sm:space-y-6 bg-white dark:bg-black p-4 sm:p-6 md:p-8 rounded-lg border border-black/10 dark:border-white/10"
      >
        <div>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              {step === "email" ? (
                <Mail className="text-white dark:text-black" size={24} />
              ) : step === "code" ? (
                <Shield className="text-white dark:text-black" size={24} />
              ) : (
                <Lock className="text-white dark:text-black" size={24} />
              )}
            </div>
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-black dark:text-white">
            {step === "email"
              ? "Reset Password"
              : step === "code"
              ? "Verify Identity"
              : "Set New Password"}
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold">
            {step === "email"
              ? "Enter your email address to begin"
              : step === "code"
              ? `Enter your ${codeType === "totp" ? "TOTP code" : "recovery code"} from your authenticator app`
              : "Enter your new password below"}
          </p>
        </div>

        {step === "email" && (
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleEmailSubmit}>
            {error && (
              <div className="bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white px-4 py-3 rounded-lg font-bold text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full px-3 py-2.5 border border-black/20 dark:border-white/20 rounded-lg placeholder-black/40 dark:placeholder-white/40 text-black dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold"
                placeholder="your.email@example.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <motion.button
                type="submit"
                disabled={loading || !email}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white dark:text-black bg-black dark:bg-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </motion.button>
              <Link
                href="/auth/signin"
                className="block w-full text-center text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {step === "code" && (
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleCodeSubmit}>
            {error && (
              <div className="bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white px-4 py-3 rounded-lg font-bold text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="code"
                className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
              >
                {codeType === "totp" ? "TOTP Code (6 digits)" : "Recovery Code (8 characters)"}
              </label>
              <input
                id="code"
                name="code"
                type="text"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => {
                  const value = e.target.value;
                  // Format based on code type
                  if (codeType === "totp") {
                    // Only allow digits, max 6
                    const digits = value.replace(/\D/g, "").slice(0, 6);
                    setCode(digits);
                  } else {
                    // Allow hex characters, uppercase, max 8
                    const hex = value.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 8);
                    setCode(hex);
                  }
                  setError("");
                }}
                className="w-full px-3 py-2.5 border border-black/20 dark:border-white/20 rounded-lg placeholder-black/40 dark:placeholder-white/40 text-black dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold text-center tracking-widest"
                placeholder={codeType === "totp" ? "000000" : "XXXXXXXX"}
                maxLength={codeType === "totp" ? 6 : 8}
                disabled={loading}
                autoFocus
              />
              <p className="mt-1.5 text-xs text-black/60 dark:text-white/60 font-bold">
                {codeType === "totp"
                  ? "Enter the 6-digit code from your authenticator app"
                  : "Enter your 8-character recovery code"}
              </p>
            </div>

            {/* Allow switching between TOTP and recovery code if both are available */}
            {hasMFA && hasRecoveryCodes && (
              <button
                type="button"
                onClick={() => {
                  setCodeType(codeType === "totp" ? "recovery" : "totp");
                  setCode("");
                  setError("");
                }}
                className="w-full text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold transition-colors"
              >
                Use {codeType === "totp" ? "recovery code" : "TOTP code"} instead
              </button>
            )}

            <div className="space-y-2">
              <motion.button
                type="submit"
                disabled={loading || !code}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white dark:text-black bg-black dark:bg-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="block w-full text-center text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handlePasswordSubmit}>
            {error && (
              <div className="bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white px-4 py-3 rounded-lg font-bold text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
                >
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full px-3 py-2.5 border border-black/20 dark:border-white/20 rounded-lg placeholder-black/40 dark:placeholder-white/40 text-black dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold"
                  placeholder="Password (min 8 characters)"
                  minLength={8}
                  disabled={loading}
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-black/60 dark:text-white/60 font-bold">
                  Password must be at least 8 characters long and unique
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full px-3 py-2.5 border border-black/20 dark:border-white/20 rounded-lg placeholder-black/40 dark:placeholder-white/40 text-black dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold"
                  placeholder="Confirm your password"
                  minLength={8}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <motion.button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white dark:text-black bg-black dark:bg-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setStep("code");
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="block w-full text-center text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen-responsive flex items-center justify-center bg-white dark:bg-black">
          <div className="text-black dark:text-white font-bold">Loading...</div>
        </div>
      }
    >
      <PasswordResetForm />
    </Suspense>
  );
}
