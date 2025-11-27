"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Shield } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Check if MFA code is required
        if (mfaRequired && mfaCode) {
          // Verify MFA code
          const mfaResponse = await fetch("/api/auth/mfa/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: mfaCode }),
          });

          const mfaData = await mfaResponse.json();

          if (!mfaResponse.ok) {
            setError(mfaData.error || "Invalid MFA code");
            setLoading(false);
            setMfaCode("");
            return;
          }

          // MFA verified, now complete login
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });

          if (result?.error) {
            setError("Login failed after MFA verification");
            setLoading(false);
            setMfaRequired(false);
            setMfaCode("");
            return;
          }

          // Login successful, proceed to dashboard
          router.push("/");
          router.refresh();
          return;
        }

        // First, check if user has MFA enabled by attempting login
        // We'll use a custom approach: try to get user info first
        const checkMfaResponse = await fetch("/api/auth/check-mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (checkMfaResponse.ok) {
          const checkData = await checkMfaResponse.json();
          
          if (checkData.mfaEnabled) {
            // MFA is enabled, prompt for code
            setMfaRequired(true);
            setLoading(false);
            return;
          }
        }

        // No MFA or MFA check failed, proceed with normal login
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
          setLoading(false);
          return;
        }

        // Login successful, proceed to dashboard
        router.push("/");
        router.refresh();
      } else {
        // Register
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Registration failed");
            setLoading(false);
            return;
          }

          // Registration successful
          setError(""); // Clear any errors
          alert(data.message || "Account created successfully. You can now sign in.");
          
          // Switch to login mode
          setIsLogin(true);
          setLoading(false);
        } catch (fetchError) {
          setError("Failed to register. Please try again.");
          setLoading(false);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen-responsive flex items-center justify-center bg-white dark:bg-black px-3 sm:px-4 w-full py-4 sm:py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-md w-full space-y-4 sm:space-y-6 md:space-y-8 bg-white dark:bg-black p-4 sm:p-6 md:p-8 rounded-lg border border-black/10 dark:border-white/10 mx-auto"
      >
        <div>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <LayoutDashboard className="text-white dark:text-black" size={24} />
            </div>
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-black dark:text-white">
            {isLogin ? "Welcome back" : "Get started"}
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold">
            {isLogin ? "Sign in to continue" : "Create your account to begin"}
          </p>
          <p className="mt-2 text-center text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold">
            {isLogin ? (
              <>
                Or{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-bold text-black dark:text-white hover:opacity-80 underline"
                >
                  create a new account
                </button>
              </>
            ) : (
              <>
                Or{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-bold text-black dark:text-white hover:opacity-80 underline"
                >
                  sign in to existing account
                </button>
              </>
            )}
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white px-4 py-3 rounded-lg font-bold text-sm">
              {error}
            </div>
          )}
          <div className="space-y-3 sm:space-y-4">
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-black/20 dark:border-white/20 rounded-lg placeholder-black/40 dark:placeholder-white/40 text-black dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold"
                  placeholder="Your name"
                />
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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-black/20 dark:border-white/20 rounded-lg placeholder-black/40 dark:placeholder-white/40 text-black dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold"
                placeholder="Email address"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-bold text-black dark:text-white"
                >
                  Password
                </label>
                {isLogin && (
                  <Link
                    href="/auth/password/reset"
                    className="text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold transition-colors"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required={!mfaRequired}
                disabled={mfaRequired}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-black/20 dark:border-white/20 rounded-lg placeholder-black/40 dark:placeholder-white/40 text-black dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={isLogin ? "Password" : "Password (min 8 characters)"}
                minLength={isLogin ? undefined : 8}
              />
            </div>
            {mfaRequired && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="text-black dark:text-white" size={16} />
                  <label
                    htmlFor="mfaCode"
                    className="block text-xs sm:text-sm font-bold text-black dark:text-white"
                  >
                    Two-Factor Authentication Code
                  </label>
                </div>
                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  required
                  value={mfaCode}
                  onChange={(e) => {
                    setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  className="w-full px-3 py-2.5 border border-black/20 dark:border-white/20 rounded-lg placeholder-black/40 dark:placeholder-white/40 text-black dark:text-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold text-center tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-black/60 dark:text-white/60 font-bold">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white dark:text-black bg-black dark:bg-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? "Please wait..."
                : mfaRequired
                ? "Verify Code"
                : isLogin
                ? "Sign in"
                : "Create account"}
            </motion.button>
            {mfaRequired && (
              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false);
                  setMfaCode("");
                  setError("");
                }}
                className="w-full text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold transition-colors"
              >
                Back to password
              </button>
            )}
          </div>
        </form>

      </motion.div>
    </div>
  );
}
