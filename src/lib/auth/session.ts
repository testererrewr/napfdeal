import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  country: string | null;
  role: string;
};

/** Current user (or null), once per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const s = await getAuth().api.getSession({ headers: await headers() });
  if (!s) return null;
  const rows = await getDb()
    .select({ country: user.country, role: user.role })
    .from(user)
    .where(eq(user.id, s.user.id))
    .limit(1);
  return {
    id: s.user.id,
    email: s.user.email,
    name: s.user.name,
    emailVerified: s.user.emailVerified,
    country: rows[0]?.country ?? null,
    role: rows[0]?.role ?? "user",
  };
});
