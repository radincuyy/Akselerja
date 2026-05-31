import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { DefaultSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { migrateProfileIdAsync, profileCacheTag } from "./lib/profile/profile-store";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (
        account?.provider !== "credentials" &&
        account?.providerAccountId &&
        typeof user.email === "string"
      ) {
        try {
          const migrated = await migrateProfileIdAsync(
            account.providerAccountId,
            user.email,
          );
          if (migrated) {
            revalidateTag(profileCacheTag(account.providerAccountId));
          }
        } catch (err) {
          console.error("[auth] profile migration failed", err);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      const isCredentials =
        account?.provider === "credentials" ||
        (!account && token.provider === "credentials");

      if (user) {
        const stableId =
          account?.provider !== "credentials" && account?.providerAccountId
            ? account.providerAccountId
            : user.id ||
              (typeof user.email === "string" ? user.email.toLowerCase() : "");
        token.id = stableId;
        if (account?.provider) token.provider = account.provider;

        if (
          account?.provider === "credentials" &&
          typeof user.email === "string"
        ) {
          try {
            const { getPasswordUpdatedAtMs } = await import("./lib/auth/user-store");
            token.pwc = (await getPasswordUpdatedAtMs(user.email)) ?? 0;
          } catch {
            token.pwc = 0;
          }
          token.pwcCheckedAt = Date.now();
        }
        return token;
      }

      if (isCredentials && typeof token.email === "string") {
        const RECHECK_MS = 5 * 60 * 1000;
        const lastCheck =
          typeof token.pwcCheckedAt === "number" ? token.pwcCheckedAt : 0;
        if (Date.now() - lastCheck >= RECHECK_MS) {
          try {
            const { getPasswordUpdatedAtMs } = await import("./lib/auth/user-store");
            const current = (await getPasswordUpdatedAtMs(token.email)) ?? 0;
            const stamped = typeof token.pwc === "number" ? token.pwc : 0;
            if (current > stamped) {
              return null;
            }
            token.pwcCheckedAt = Date.now();
          } catch {}
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/masuk",
  },
  trustHost: true,
} satisfies NextAuthConfig;
