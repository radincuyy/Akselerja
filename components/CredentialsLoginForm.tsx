"use client";

import { useId, useState } from "react";
import PasswordField from "@/components/PasswordField";
import { loginWithEmailPassword } from "@/lib/auth/signin-actions";

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
    const res = await loginWithEmailPassword({
      email,
      password,
      callbackUrl,
    });
    if (!res.ok) {
      setLoading(false);
      setError(res.error);
      return;
    }
    window.location.assign(res.url);
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
      <PasswordField
        id={pwId}
        name="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        placeholder="Masukkan password"
        required
      />
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
