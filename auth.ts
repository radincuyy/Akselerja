import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verifyUserCredentials } from "./lib/user-store";

// Akun demo untuk pitch/juri — bypass Cosmos.
const DEMO_USERS: Record<
  string,
  { id: string; name: string; email: string; password: string; image: null }
> = {
  "rahmat@akselerja.demo": {
    id: "me",
    name: "Rahmat Saputra",
    email: "rahmat@akselerja.demo",
    password: "demo1234",
    image: null,
  },
  "sari@akselerja.demo": {
    id: "hr-cipta-1",
    name: "Sari Wijaya",
    email: "sari@akselerja.demo",
    password: "demo1234",
    image: null,
  },
};

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
        const result = await verifyUserCredentials(email, password);
        if (!result.ok) return null;
        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        } as { id: string; name: string; email: string; role: "candidate" | "company" };
      },
    }),
    Credentials({
      id: "demo",
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        const user = DEMO_USERS[email];
        if (!user || user.password !== password) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
});
