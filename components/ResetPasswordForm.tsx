"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordField from "@/components/PasswordField";
import { isPasswordValid, PASSWORD_RULE_ERROR } from "@/lib/password-rules";

export default function ResetPasswordForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const tokenPresent = Boolean(sp.get("token"));
  const pwId = useId();
  const pw2Id = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    const pw = password;
    const pw2 = confirmPassword;
    if (!isPasswordValid(pw)) {
      setError(PASSWORD_RULE_ERROR);
      return;
    }
    if (pw !== pw2) {
      setError("Password baru dan konfirmasi tidak sama.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push("/masuk?reset=1");
  }

  if (!tokenPresent) {
    return (
      <div
        role="alert"
        className="mt-8 rounded-lg border border-(--color-signal-clay) bg-(--color-tint) p-5"
      >
        <p className="text-sm font-semibold text-(--color-ink)">
          Tautan tidak valid
        </p>
        <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
          Tautan reset tidak ditemukan atau sudah kadaluarsa. Minta tautan
          baru dari halaman lupa password.
        </p>
        <Link
          href="/lupa-password"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
        >
          Minta tautan baru →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
      <PasswordField
        id={pwId}
        name="password"
        label="Password baru"
        value={password}
        onChange={setPassword}
        onBlur={() => setPasswordTouched(true)}
        autoComplete="new-password"
        required
        showInvalid={submitted || passwordTouched}
        showRequirements
      />
      <PasswordField
        id={pw2Id}
        name="confirm"
        label="Ulangi password baru"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        required
      />
      {error ? (
        <p role="alert" className="text-sm text-(--color-signal-clay)">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-3 text-base font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-60"
      >
        {submitting ? "Menyimpan…" : "Simpan password baru"}
      </button>
    </form>
  );
}
