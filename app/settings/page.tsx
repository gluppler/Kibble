/**
 * Settings Page Component
 * 
 * Provides user account management features including:
 * - Account information display
 * - Account deletion with re-authentication
 * 
 * Security Features:
 * - Requires re-authentication (password) for account deletion
 * - Confirmation text required to prevent accidental deletion
 * - Secure error handling
 * - Client-side validation + server-side enforcement
 */

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { logError } from "@/lib/logger";
import { 
  Settings, 
  User, 
  Trash2, 
  ArrowLeft, 
  AlertTriangle,
  Lock,
  Shield,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaVerifyCode, setMfaVerifyCode] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dueDateAlertsEnabled, setDueDateAlertsEnabled] = useState(true);
  const [completionAlertsEnabled, setCompletionAlertsEnabled] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Redirect if not authenticated (use useEffect to avoid side effects during render)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch MFA status and notification preferences
  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([
        fetch("/api/auth/mfa/status").then((res) => res.json()),
        fetch("/api/user/notifications").then((res) => res.json()).catch(() => ({})),
      ])
        .then(([mfaData, notificationData]) => {
          if (mfaData.mfaEnabled !== undefined) {
            setMfaEnabled(mfaData.mfaEnabled);
          }
          if (notificationData.notificationsEnabled !== undefined) {
            setNotificationsEnabled(notificationData.notificationsEnabled);
          }
          if (notificationData.dueDateAlertsEnabled !== undefined) {
            setDueDateAlertsEnabled(notificationData.dueDateAlertsEnabled);
          }
          if (notificationData.completionAlertsEnabled !== undefined) {
            setCompletionAlertsEnabled(notificationData.completionAlertsEnabled);
          }
        })
        .catch((err) => logError("Error fetching user preferences:", err));
    }
  }, [session]);

  // Handle MFA setup
  const handleMfaSetup = async () => {
    setMfaLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to set up MFA");
        setMfaLoading(false);
        return;
      }
      setMfaQrCode(data.qrCode);
      setMfaBackupCodes(data.backupCodes);
      setMfaSecret(data.secret);
      setShowMfaSetup(true);
      setMfaLoading(false);
    } catch (err) {
      logError("Error setting up MFA:", err);
      setError("Failed to set up MFA");
      setMfaLoading(false);
    }
  };

  // Handle MFA verification and enable
  const handleMfaVerify = async () => {
    if (!mfaVerifyCode || mfaVerifyCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    setMfaLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaVerifyCode, setup: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Invalid code. Please try again.");
        setMfaLoading(false);
        return;
      }
      setMfaEnabled(true);
      setShowMfaSetup(false);
      setMfaVerifyCode("");
      setMfaQrCode("");
      setMfaSecret("");
      setMfaLoading(false);
    } catch (err) {
      logError("Error verifying MFA:", err);
      setError("Failed to verify MFA code");
      setMfaLoading(false);
    }
  };

  // Handle MFA disable
  const handleMfaDisable = async () => {
    if (!disablePassword) {
      setError("Password is required");
      return;
    }
    setMfaLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to disable MFA");
        setMfaLoading(false);
        return;
      }
      setMfaEnabled(false);
      setShowDisableDialog(false);
      setDisablePassword("");
      setMfaLoading(false);
    } catch (err) {
      logError("Error disabling MFA:", err);
      setError("Failed to disable MFA");
      setMfaLoading(false);
    }
  };

  // Copy backup codes
  const copyBackupCodes = () => {
    const codesText = mfaBackupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  /**
   * Handles account deletion
   * 
   * Security Flow:
   * 1. Client-side validation
   * 2. Send request to API with password and confirmation
   * 3. API verifies password (re-authentication)
   * 4. API deletes account
   * 5. Sign out and redirect to sign-in
   */
  const handleDeleteAccount = async () => {
    setError("");
    
    // Client-side validation
    if (!password || password.trim().length === 0) {
      setError("Password is required");
      return;
    }

    if (confirmText !== "DELETE") {
      setError("Please type 'DELETE' to confirm");
      return;
    }

    setLoading(true);
    setIsDeleting(true);

    try {
      // Call account deletion API
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: password.trim(),
          confirmText: confirmText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Generic error message from server
        setError(data.error || "Failed to delete account");
        setLoading(false);
        setIsDeleting(false);
        return;
      }

      // Account deleted successfully
      // Sign out and redirect to sign-in
      await signOut({ 
        redirect: false,
        callbackUrl: "/auth/signin" 
      });
      
      router.push("/auth/signin");
      router.refresh();
    } catch (err) {
      logError("Error deleting account:", err);
      setError("An unexpected error occurred");
      setLoading(false);
      setIsDeleting(false);
    }
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen-responsive bg-white dark:bg-black flex items-center justify-center w-full">
        <div className="text-black dark:text-white font-bold">Loading...</div>
      </div>
    );
  }

  // Don't render content if not authenticated (redirect will happen via useEffect)
  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className="min-h-screen-responsive bg-white dark:bg-black w-full">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12 w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white mb-4 sm:mb-6 transition-colors font-bold"
          >
            <ArrowLeft size={16} />
            <span className="text-xs sm:text-sm">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <Settings className="text-white dark:text-black" size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black dark:text-white">
              Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold">
            Manage your account and preferences
          </p>
        </div>

        {/* Account Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/10 p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <User className="text-white dark:text-black" size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
              Account Information
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-bold text-black/60 dark:text-white/60">
                Name
              </label>
              <p className="mt-1 text-sm sm:text-base font-bold text-black dark:text-white">
                {session.user?.name || "Not set"}
              </p>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-bold text-black/60 dark:text-white/60">
                Email
              </label>
              <p className="mt-1 text-sm sm:text-base font-bold text-black dark:text-white">
                {session.user?.email || "Not set"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* MFA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.03 }}
          className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/10 p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <Shield className="text-white dark:text-black" size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                Two-Factor Authentication
              </h2>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mt-1 font-bold">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg">
              <p className="text-xs sm:text-sm text-black dark:text-white font-bold">{error}</p>
            </div>
          )}

          {!showMfaSetup && !mfaEnabled && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold">
                Two-factor authentication (2FA) adds an additional layer of security by requiring a code from your authenticator app when you sign in.
              </p>
              <button
                onClick={handleMfaSetup}
                disabled={mfaLoading}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold flex items-center gap-2"
              >
                {mfaLoading ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    Enable Two-Factor Authentication
                  </>
                )}
              </button>
            </div>
          )}

          {showMfaSetup && !mfaEnabled && (
            <div className="space-y-4">
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
                <h3 className="text-sm sm:text-base font-bold text-black dark:text-white mb-2">
                  Step 1: Scan QR Code
                </h3>
                <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-4 font-bold">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {mfaQrCode && (
                  <div className="flex justify-center mb-4">
                    <img src={mfaQrCode} alt="MFA QR Code" className="w-48 h-48 border border-black/20 dark:border-white/20 rounded-lg" />
                  </div>
                )}
                <div className="p-3 bg-white dark:bg-black rounded border border-black/20 dark:border-white/20">
                  <p className="text-xs font-bold text-black/60 dark:text-white/60 mb-1">Manual Entry Key:</p>
                  <code className="text-xs font-mono text-black dark:text-white break-all">{mfaSecret}</code>
                </div>
              </div>

              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
                <h3 className="text-sm sm:text-base font-bold text-black dark:text-white mb-2">
                  Step 2: Save Backup Codes
                </h3>
                <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-3 font-bold">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="p-3 bg-white dark:bg-black rounded border border-black/20 dark:border-white/20 mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {mfaBackupCodes.map((code, idx) => (
                      <code key={idx} className="text-xs font-mono text-black dark:text-white text-center py-1">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
                <button
                  onClick={copyBackupCodes}
                  className="w-full px-3 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
                >
                  {copiedCodes ? (
                    <>
                      <Check size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Backup Codes
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-2">
                  Step 3: Enter Verification Code
                </label>
                <input
                  type="text"
                  value={mfaVerifyCode}
                  onChange={(e) => {
                    setMfaVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm font-bold text-center tracking-widest"
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-black/60 dark:text-white/60 font-bold">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMfaSetup(false);
                    setMfaQrCode("");
                    setMfaBackupCodes([]);
                    setMfaSecret("");
                    setMfaVerifyCode("");
                    setError("");
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMfaVerify}
                  disabled={mfaLoading || mfaVerifyCode.length !== 6}
                  className="flex-1 px-3 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
                >
                  {mfaLoading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Enable MFA"
                  )}
                </button>
              </div>
            </div>
          )}

          {mfaEnabled && !showMfaSetup && (
            <div className="space-y-4">
              <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                  <p className="text-sm font-bold text-black dark:text-white">
                    Two-Factor Authentication is enabled
                  </p>
                </div>
                <p className="text-xs text-black/60 dark:text-white/60 font-bold">
                  Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in.
                </p>
              </div>
              <button
                onClick={() => setShowDisableDialog(true)}
                className="px-4 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold"
              >
                Disable Two-Factor Authentication
              </button>
            </div>
          )}
        </motion.div>

        {/* Notification Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.04 }}
          className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/10 p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <Settings className="text-white dark:text-black" size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                Notification Preferences
              </h2>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mt-1 font-bold">
                Control when you receive alerts and notifications
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Global Notification Toggle */}
            <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
              <div className="flex-1">
                <label className="text-sm sm:text-base font-bold text-black dark:text-white block mb-1">
                  Enable Notifications
                </label>
                <p className="text-xs text-black/60 dark:text-white/60 font-bold">
                  Master toggle for all notifications and alerts
                </p>
              </div>
              <button
                onClick={async () => {
                  const newValue = !notificationsEnabled;
                  setNotificationsEnabled(newValue);
                  setNotificationsLoading(true);
                  try {
                    const res = await fetch("/api/user/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ notificationsEnabled: newValue }),
                    });
                    if (!res.ok) {
                      setNotificationsEnabled(!newValue); // Revert on error
                      setError("Failed to update notification preferences");
                    } else {
                      // Emit event to notify other components/tabs
                      if (typeof window !== "undefined") {
                        localStorage.setItem("kibble:notifications:updated", Date.now().toString());
                        window.dispatchEvent(new CustomEvent("kibble:notifications:updated", { detail: { type: "notifications:updated" } }));
                      }
                    }
                  } catch (err) {
                    setNotificationsEnabled(!newValue); // Revert on error
                    logError("Error updating notifications:", err);
                    setError("Failed to update notification preferences");
                  } finally {
                    setNotificationsLoading(false);
                  }
                }}
                disabled={notificationsLoading}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  notificationsEnabled
                    ? "bg-black dark:bg-white"
                    : "bg-black/20 dark:bg-white/20"
                }`}
                aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                type="button"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Due Date Alerts Toggle */}
            <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
              <div className="flex-1">
                <label className="text-sm sm:text-base font-bold text-black dark:text-white block mb-1">
                  Due Date Alerts
                </label>
                <p className="text-xs text-black/60 dark:text-white/60 font-bold">
                  Get notified when tasks are due or overdue
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!notificationsEnabled) {
                    setError("Enable notifications first to use individual alert types");
                    return;
                  }
                  const newValue = !dueDateAlertsEnabled;
                  setDueDateAlertsEnabled(newValue);
                  setNotificationsLoading(true);
                  try {
                    const res = await fetch("/api/user/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ dueDateAlertsEnabled: newValue }),
                    });
                    if (!res.ok) {
                      setDueDateAlertsEnabled(!newValue); // Revert on error
                      setError("Failed to update notification preferences");
                    } else {
                      // Emit event to notify other components/tabs
                      if (typeof window !== "undefined") {
                        localStorage.setItem("kibble:notifications:updated", Date.now().toString());
                        window.dispatchEvent(new CustomEvent("kibble:notifications:updated", { detail: { type: "notifications:updated" } }));
                      }
                    }
                  } catch (err) {
                    setDueDateAlertsEnabled(!newValue); // Revert on error
                    logError("Error updating notifications:", err);
                    setError("Failed to update notification preferences");
                  } finally {
                    setNotificationsLoading(false);
                  }
                }}
                disabled={notificationsLoading || !notificationsEnabled}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  dueDateAlertsEnabled && notificationsEnabled
                    ? "bg-black dark:bg-white"
                    : "bg-black/20 dark:bg-white/20"
                } ${!notificationsEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label={dueDateAlertsEnabled ? "Disable due date alerts" : "Enable due date alerts"}
                type="button"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${
                    dueDateAlertsEnabled && notificationsEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Completion Alerts Toggle */}
            <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
              <div className="flex-1">
                <label className="text-sm sm:text-base font-bold text-black dark:text-white block mb-1">
                  Completion Alerts
                </label>
                <p className="text-xs text-black/60 dark:text-white/60 font-bold">
                  Get notified when tasks are moved to Done
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!notificationsEnabled) {
                    setError("Enable notifications first to use individual alert types");
                    return;
                  }
                  const newValue = !completionAlertsEnabled;
                  setCompletionAlertsEnabled(newValue);
                  setNotificationsLoading(true);
                  try {
                    const res = await fetch("/api/user/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ completionAlertsEnabled: newValue }),
                    });
                    if (!res.ok) {
                      setCompletionAlertsEnabled(!newValue); // Revert on error
                      setError("Failed to update notification preferences");
                    } else {
                      // Emit event to notify other components/tabs
                      if (typeof window !== "undefined") {
                        localStorage.setItem("kibble:notifications:updated", Date.now().toString());
                        window.dispatchEvent(new CustomEvent("kibble:notifications:updated", { detail: { type: "notifications:updated" } }));
                      }
                    }
                  } catch (err) {
                    setCompletionAlertsEnabled(!newValue); // Revert on error
                    logError("Error updating notifications:", err);
                    setError("Failed to update notification preferences");
                  } finally {
                    setNotificationsLoading(false);
                  }
                }}
                disabled={notificationsLoading || !notificationsEnabled}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  completionAlertsEnabled && notificationsEnabled
                    ? "bg-black dark:bg-white"
                    : "bg-black/20 dark:bg-white/20"
                } ${!notificationsEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label={completionAlertsEnabled ? "Disable completion alerts" : "Enable completion alerts"}
                type="button"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${
                    completionAlertsEnabled && notificationsEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white dark:bg-black rounded-lg border-2 border-black dark:border-white p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <AlertTriangle className="text-white dark:text-black" size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                Danger Zone
              </h2>
              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mt-1 font-bold">
                Irreversible and destructive actions
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
              <div className="flex items-start gap-3">
                <Shield className="text-black dark:text-white flex-shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <h3 className="font-bold text-black dark:text-white mb-1 text-sm sm:text-base">
                    Delete Account
                  </h3>
                  <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-4 font-bold">
                    Once you delete your account, there is no going back. This will permanently delete:
                  </p>
                  <ul className="text-xs sm:text-sm text-black/60 dark:text-white/60 list-disc list-inside space-y-1 mb-4 font-bold">
                    <li>All your kanban boards</li>
                    <li>All your tasks and columns</li>
                    <li>All your account data</li>
                    <li>All your sessions</li>
                  </ul>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Delete Account Dialog */}
        <AnimatePresence>
          {showDeleteDialog && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!isDeleting) {
                    setShowDeleteDialog(false);
                    setPassword("");
                    setConfirmText("");
                    setError("");
                  }
                }}
                className="fixed inset-0 bg-black/50 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-black rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6 border border-black/10 dark:border-white/10"
                >
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                      <AlertTriangle className="text-white dark:text-black" size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                        Delete Account
                      </h2>
                      <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
                      <p className="text-xs sm:text-sm text-black dark:text-white font-bold">
                        <strong>Warning:</strong> This will permanently delete your account and all associated data. You will need to re-authenticate to confirm this action.
                      </p>
                    </div>

                    {/* Password field for re-authentication */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-2">
                        <Lock size={12} className="inline mr-1" />
                        Enter your password to confirm
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Your current password"
                        disabled={isDeleting}
                        className="w-full px-3 py-2 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                        autoFocus
                      />
                    </div>

                    {/* Confirmation text field */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-2">
                        Type <strong className="text-black dark:text-white">DELETE</strong> to confirm
                      </label>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => {
                          setConfirmText(e.target.value);
                          setError("");
                        }}
                        placeholder="DELETE"
                        disabled={isDeleting}
                        className="w-full px-3 py-2 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg">
                        <p className="text-xs sm:text-sm text-black dark:text-white font-bold">{error}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteDialog(false);
                        setPassword("");
                        setConfirmText("");
                        setError("");
                        setIsDeleting(false);
                      }}
                      disabled={isDeleting}
                      className="flex-1 px-3 sm:px-4 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !password || confirmText !== "DELETE"}
                      className="flex-1 px-3 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-bold"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Delete Account
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Disable MFA Dialog */}
        <AnimatePresence>
          {showDisableDialog && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!mfaLoading) {
                    setShowDisableDialog(false);
                    setDisablePassword("");
                    setError("");
                  }
                }}
                className="fixed inset-0 bg-black/50 z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-black rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6 border border-black/10 dark:border-white/10"
                >
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                      <Shield className="text-white dark:text-black" size={18} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                        Disable Two-Factor Authentication
                      </h2>
                      <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold">
                        This will reduce your account security
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
                      <p className="text-xs sm:text-sm text-black dark:text-white font-bold">
                        <strong>Warning:</strong> Disabling two-factor authentication will make your account less secure. You'll need to enter your password to confirm this action.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-2">
                        <Lock size={12} className="inline mr-1" />
                        Enter your password to confirm
                      </label>
                      <input
                        type="password"
                        value={disablePassword}
                        onChange={(e) => {
                          setDisablePassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Your current password"
                        disabled={mfaLoading}
                        className="w-full px-3 py-2 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                        autoFocus
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg">
                        <p className="text-xs sm:text-sm text-black dark:text-white font-bold">{error}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setShowDisableDialog(false);
                        setDisablePassword("");
                        setError("");
                        setMfaLoading(false);
                      }}
                      disabled={mfaLoading}
                      className="flex-1 px-3 sm:px-4 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMfaDisable}
                      disabled={mfaLoading || !disablePassword}
                      className="flex-1 px-3 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm font-bold"
                    >
                      {mfaLoading ? (
                        <>
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                          Disabling...
                        </>
                      ) : (
                        "Disable MFA"
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
