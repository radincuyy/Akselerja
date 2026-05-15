"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const emailId = useId();
  const pwId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const pw = String(data.get("password") ?? "");
    if (!email || !pw) {
      setError("Email dan password tidak boleh kosong.");
      setSubmitting(false);
      return;
    }
    // eslint-disable-next-line no-console
    console.log("[Akselerja login]", { email });
    await new Promise((r) => setTimeout(r, 500));
    // Demo routing: emails containing "hr" or "@perusahaan" go to /hr
    const target = /hr|@perusahaan|@pt\./i.test(email) ? "/hr" : "/app";
    router.push(target);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className="text-xs font-medium tracking-wide text-(--color-muted)">
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="kamu@email.com"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={pwId} className="text-xs font-medium tracking-wide text-(--color-muted)">
            Password
          </label>
          <a href="#" className="text-xs text-(--color-teal) hover:text-(--color-teal-deep)">
            Lupa password?
          </a>
        </div>
        <input
          id={pwId}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-(--color-signal-clay)">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-3 text-base font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-60"
      >
        {submitting ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
