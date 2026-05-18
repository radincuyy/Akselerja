import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "candidate" | "company";
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const explicitRole = (user as { role?: "candidate" | "company" }).role;
        if (explicitRole === "candidate" || explicitRole === "company") {
          token.role = explicitRole;
        } else if (user.email?.endsWith("@akselerja.demo")) {
          token.role = user.id === "me" ? "candidate" : "company";
        } else {
          token.role = "candidate";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role =
          (token.role as "candidate" | "company") ?? "candidate";
      }
      return session;
    },
  },
  pages: {
    signIn: "/masuk",
  },
  trustHost: true,
} satisfies NextAuthConfig;
