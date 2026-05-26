import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { DefaultSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { migrateProfileIdAsync, profileCacheTag } from "./lib/profile-store";

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
      if (user) {
        const stableId =
          account?.provider !== "credentials" && account?.providerAccountId
            ? account.providerAccountId
            : user.id ||
              (typeof user.email === "string" ? user.email.toLowerCase() : "");
        token.id = stableId;
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
