import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const { verifyUserCredentials } = await import("./lib/user-store");
        const result = await verifyUserCredentials(email, password);
        if (!result.ok) return null;
        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        };
      },
    }),
  ],
});
