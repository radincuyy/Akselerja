"use client";

import { useEffect, useId, useState } from "react";
import PasswordField from "@/components/PasswordField";
import { signupWithEmailPassword } from "@/lib/auth/auth-actions";
import { isPasswordValid, PASSWORD_RULE_ERROR } from "@/lib/auth/password-rules";
import { loginWithEmailPassword } from "@/lib/auth/signin-actions";

export default function KandidatSignupForm() {
  const emailId = useId();
  const pwId = useId();
  const nameId = useId();
  const nameErrorId = `${nameId}-error`;
  const emailErrorId = `${emailId}-error`;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    if (e) setEmail(e);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    const pw = password;

    if (!normalizedName || !normalizedEmail || !pw) {
      setError("Lengkapi semua field yang wajib diisi.");
      return;
    }
    if (!isPasswordValid(pw)) {
      setError(PASSWORD_RULE_ERROR);
      return;
    }

    setSubmitting(true);
    const result = await signupWithEmailPassword({
      name: normalizedName,
      email: normalizedEmail,
      password: pw,
    });
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Auto-login dengan credentials yang baru saja dibuat, lalu redirect ke onboarding.
    const signInRes = await loginWithEmailPassword({
      email: normalizedEmail,
      password: pw,
      callbackUrl: "/onboarding",
    });
    if (!signInRes.ok) {
      // Akun sudah dibuat tapi auto-login gagal — arahkan ke /masuk.
      window.location.assign(
        "/masuk?email=" + encodeURIComponent(normalizedEmail),
      );
      return;
    }
    window.location.assign(signInRes.url);
  }

  const nameError = submitted && name.trim().length === 0;
  const emailError = submitted && email.trim().length === 0;
  const inputClass =
    "w-full rounded-md border bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) transition-colors";
  const fieldClass = (hasError: boolean) =>
    `${inputClass} ${
      hasError
        ? "border-(--color-signal-clay) focus:border-(--color-signal-clay)"
        : "border-(--color-line) focus:border-(--color-teal)"
    }`;

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
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Nama lengkap kamu"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? nameErrorId : undefined}
          className={fieldClass(nameError)}
        />
        {nameError ? (
          <p id={nameErrorId} role="alert" className="text-sm text-(--color-signal-clay)">
            Nama lengkap wajib diisi.
          </p>
        ) : null}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="kamu@email.com"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? emailErrorId : undefined}
          className={fieldClass(emailError)}
        />
        {emailError ? (
          <p id={emailErrorId} role="alert" className="text-sm text-(--color-signal-clay)">
            Email wajib diisi.
          </p>
        ) : null}
      </div>
      <PasswordField
        id={pwId}
        name="password"
        label="Password"
        value={password}
        onChange={setPassword}
        onBlur={() => setPasswordTouched(true)}
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
        required
        showInvalid={submitted || passwordTouched}
        showRequirements
      />

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
