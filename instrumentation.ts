// Runs once at server startup (Next.js instrumentation hook). In production we
// assert the REQUIRED environment variables are present so a misconfigured
// deploy fails loudly at boot instead of silently degrading at request time.
// Never logs secret values, only the names of what is missing.

export async function register() {
  if (process.env.NODE_ENV !== "production") return;

  const missing: string[] = [];

  const has = (name: string) => Boolean(process.env[name]?.trim());
  const require = (name: string) => {
    if (!has(name)) missing.push(name);
  };

  require("AUTH_SECRET");
  require("COSMOS_ENDPOINT");
  require("COSMOS_KEY");
  require("COSMOS_DATABASE");
  require("GEMINI_API_KEY");

  const hasAppUrl =
    has("NEXT_PUBLIC_APP_URL") ||
    has("APP_URL") ||
    has("AUTH_URL") ||
    has("NEXTAUTH_URL");
  if (!hasAppUrl) {
    missing.push("NEXT_PUBLIC_APP_URL (or APP_URL/AUTH_URL/NEXTAUTH_URL)");
  }

  const emailMissing = ["RESEND_API_KEY", "RESEND_FROM"].filter((n) => !has(n));
  if (emailMissing.length > 0) {
    console.warn(
      "[instrumentation] Email not configured (" +
        emailMissing.join(", ") +
        "): password reset will be unavailable. All other features work.",
    );
  }

  if (process.env.E2E_MODE === "true") {
    throw new Error(
      "[instrumentation] E2E_MODE=true is set in production. This enables the " +
        "test sign-in backdoor and non-secure cookies. Unset it before deploying.",
    );
  }

  if (missing.length > 0) {
    throw new Error(
      "[instrumentation] Missing required environment variables in production: " +
        missing.join(", ") +
        ". See .env.example.",
    );
  }
}
