import { handlers } from "@/lib/auth";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const { GET, POST } = handlers;
