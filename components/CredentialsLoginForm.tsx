"use client";

import { signIn } from "next-auth/react";
import { useId, useState } from "react";

type Props = {
  callbackUrl?: string;
};

export default function CredentialsLoginForm({ callbackUrl = "/app" }: Props) {
  const emailId = useId();
  const pwId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (!res || res.error) {
      setLoading(false);
      setError("Email atau password salah. Coba lagi.");
      return;
    }
    window.location.assign(res.url ?? callbackUrl);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={emailId}
          className="text-xs font-medium tracking-wide text-(--color-muted)"
        >
          Email
        </label>
        <input
          id={emailId}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          placeholder="kamu@email.com"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={pwId}
          className="text-xs font-medium tracking-wide text-(--color-muted)"
        >
          Password
        </label>
        <input
          id={pwId}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          minLength={8}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-(--color-signal-clay)">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-60"
      >
        {loading ? "Masuk..." : "Masuk dengan email"}
      </button>
    </form>
  );
}
