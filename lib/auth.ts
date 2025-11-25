/**
 * NextAuth configuration module
 * 
 * This module configures NextAuth.js v5 for authentication using:
 * - Credentials provider (email/password)
 * - Prisma adapter for database integration
 * - JWT session strategy
 * - Custom sign-in page
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * NextAuth configuration and exports
 * 
 * Exports:
 * - handlers: API route handlers for authentication endpoints
 * - auth: Server-side auth function
 * - signIn: Client-side sign-in function
 * - signOut: Client-side sign-out function
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  /**
   * Prisma adapter for database integration
   * Handles user, session, and account management in the database
   */
  adapter: PrismaAdapter(db) as any,
  
  /**
   * Authentication providers
   * Currently only supports email/password credentials
   */
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      
      /**
       * Authorize function - validates user credentials
       * 
       * @param credentials - Object containing email and password
       * @returns User object if credentials are valid, null otherwise
       * 
       * Process:
       * 1. Validates that email and password are provided
       * 2. Finds user in database by email
       * 3. Verifies password using bcrypt
       * 4. Returns user object with id, email, and name if valid
       */
      async authorize(credentials) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user in database
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Check if user exists and has a password
        if (!user || !user.password) {
          return null;
        }

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        // Return null if password is invalid
        if (!isPasswordValid) {
          return null;
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  
  /**
   * Session configuration
   * Uses JWT strategy (stateless sessions stored in JWT token)
   */
  session: {
    strategy: "jwt",
  },
  
  /**
   * Custom pages
   * Redirects to custom sign-in page instead of default NextAuth page
   */
  pages: {
    signIn: "/auth/signin",
  },
  
  /**
   * Callbacks for customizing JWT and session behavior
   */
  callbacks: {
    /**
     * JWT callback - called when JWT is created or updated
     * 
     * @param token - Current JWT token
     * @param user - User object (only present on initial sign-in)
     * @returns Updated token with user ID
     */
    async jwt({ token, user }) {
      // Add user ID to token on initial sign-in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    /**
     * Session callback - called when session is accessed
     * 
     * @param session - Current session object
     * @param token - JWT token containing user data
     * @returns Updated session with user ID
     */
    async session({ session, token }) {
      // Add user ID to session from token
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
