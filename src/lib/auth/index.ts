import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";
import { sendMail } from "@/lib/mail";
import { resetPasswordMail, verifyEmailMail } from "@/lib/mail-templates";
import { SITE_URL } from "@/lib/site";

/**
 * Better Auth: email + password (Argon2id, email verification, reset), Google, Discord,
 * linking accounts with the same verified email.
 * Created lazily so `next build` never needs a database or secrets.
 */
function createAuth() {
  const google =
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
      : {};
  const discord =
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? { discord: { clientId: process.env.DISCORD_CLIENT_ID, clientSecret: process.env.DISCORD_CLIENT_SECRET } }
      : {};

  return betterAuth({
    appName: "napfdeal",
    baseURL: process.env.BETTER_AUTH_URL ?? SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema: { user, session, account, verification } }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 60 * 60,
      password: { hash: hashPassword, verify: verifyPassword },
      sendResetPassword: async ({ user: u, url }) => {
        await sendMail({ to: u.email, ...resetPasswordMail(url) });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 24 * 60 * 60,
      sendVerificationEmail: async ({ user: u, url }) => {
        await sendMail({ to: u.email, ...verifyEmailMail(url) });
      },
    },
    socialProviders: { ...google, ...discord },
    account: {
      accountLinking: { enabled: true, trustedProviders: ["google", "discord"] },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      cookiePrefix: "napfdeal",
    },
    // In-memory only, nothing persisted.
    rateLimit: { enabled: true, storage: "memory", window: 60, max: 30 },
    databaseHooks: {
      // Data minimisation: no IP address, no user agent, no profile picture URL.
      session: {
        create: {
          before: async (s) => ({ data: { ...s, ipAddress: null, userAgent: null } }),
        },
        update: {
          before: async (s) => ({ data: { ...s, ipAddress: null, userAgent: null } }),
        },
      },
      user: {
        create: {
          before: async (u) => ({ data: { ...u, image: null } }),
        },
      },
    },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  if (!instance) instance = createAuth();
  return instance;
}

export function socialLoginsEnabled(): { google: boolean; discord: boolean } {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    discord: Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
  };
}
