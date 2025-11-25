import { auth } from "@/lib/auth";

export async function getServerAuthSession() {
  return await auth();
}
