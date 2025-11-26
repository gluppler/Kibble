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
import { 
  Settings, 
  User, 
  Trash2, 
  ArrowLeft, 
  AlertTriangle,
  Lock,
  Shield
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

  // Redirect if not authenticated (use useEffect to avoid side effects during render)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

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
      console.error("Error deleting account:", err);
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
      </div>
    </div>
  );
}
