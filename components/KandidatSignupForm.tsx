"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

export default function KandidatSignupForm() {
  const router = useRouter();
  const emailId = useId();
  const pwId = useId();
  const nameId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilledEmail, setPrefilledEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    if (e) setPrefilledEmail(e);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const pw = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();

    if (!name || !email || pw.length < 8) {
      setError("Isi nama lengkap, email, dan password minimal 8 karakter.");
      setSubmitting(false);
      return;
    }

    // eslint-disable-next-line no-console
    console.log("[Akselerja kandidat signup]", { name, email });
    await new Promise((r) => setTimeout(r, 500));
    router.push("/onboarding");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-xs font-medium tracking-wide text-(--color-muted)">
          Nama lengkap
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Rahmat Saputra"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
      </div>
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
          defaultValue={prefilledEmail}
          key={prefilledEmail}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={pwId} className="text-xs font-medium tracking-wide text-(--color-muted)">
          Password
        </label>
        <input
          id={pwId}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          placeholder="Minimal 8 karakter"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
        <p className="text-xs text-(--color-muted)">
          Pakai kombinasi huruf dan angka. Hindari nama atau tanggal lahir.
        </p>
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
        {submitting ? "Membuat akun…" : "Daftar dan lanjut isi profil"}
      </button>
    </form>
  );
}
