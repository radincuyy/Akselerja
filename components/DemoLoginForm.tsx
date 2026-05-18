"use client";

import { signIn } from "next-auth/react";
import { useId, useState } from "react";

export default function DemoLoginForm() {
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
    const callbackUrl = email.startsWith("sari") ? "/hr" : "/app";
    const res = await signIn("demo", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (!res || res.error) {
      setLoading(false);
      setError("Email atau password salah. Cek panduan akun demo di bawah.");
      return;
    }
    window.location.assign(res.url ?? callbackUrl);
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 grid gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={emailId}
          className="text-xs font-medium tracking-wide text-(--color-muted)"
        >
          Email demo
        </label>
        <input
          id={emailId}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          placeholder="rahmat@akselerja.demo"
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
          placeholder="demo1234"
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
        className="mt-1 inline-flex items-center justify-center rounded-md bg-(--color-ink) px-5 py-2.5 text-sm font-semibold text-(--color-paper) transition-colors hover:bg-(--color-ink)/90 disabled:opacity-60"
      >
        {loading ? "Masuk..." : "Masuk dengan akun demo"}
      </button>
      <details className="mt-1 rounded-md border border-(--color-line) bg-(--color-tint) p-3 text-sm text-(--color-muted)">
        <summary className="cursor-pointer font-medium text-(--color-ink)">
          Akun demo (klik untuk lihat)
        </summary>
        <ul className="mt-3 space-y-2 leading-relaxed">
          <li>
            <span className="font-medium text-(--color-ink)">Kandidat</span>
            <br />
            <code className="text-xs">rahmat@akselerja.demo</code> /{" "}
            <code className="text-xs">demo1234</code>
          </li>
          <li>
            <span className="font-medium text-(--color-ink)">HR Recruiter</span>
            <br />
            <code className="text-xs">sari@akselerja.demo</code> /{" "}
            <code className="text-xs">demo1234</code>
          </li>
        </ul>
      </details>
    </form>
  );
}
