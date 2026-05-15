"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

export default function PerusahaanSignupForm() {
  const router = useRouter();
  const companyId = useId();
  const sectorId = useId();
  const emailId = useId();
  const pwId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const company = String(data.get("company") ?? "").trim();
    const sector = String(data.get("sector") ?? "");
    const email = String(data.get("email") ?? "").trim();
    const pw = String(data.get("password") ?? "");

    if (!company || !sector || !email || pw.length < 8) {
      setError("Lengkapi semua kolom; password minimal 8 karakter.");
      setSubmitting(false);
      return;
    }

    // eslint-disable-next-line no-console
    console.log("[Akselerja perusahaan signup]", { company, sector, email });
    await new Promise((r) => setTimeout(r, 500));
    router.push("/hr");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={companyId} className="text-xs font-medium tracking-wide text-(--color-muted)">
          Nama perusahaan
        </label>
        <input
          id={companyId}
          name="company"
          type="text"
          required
          autoComplete="organization"
          placeholder="PT Cipta Logistik Nusantara"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={sectorId} className="text-xs font-medium tracking-wide text-(--color-muted)">
          Sektor industri
        </label>
        <select
          id={sectorId}
          name="sector"
          required
          defaultValue=""
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
        >
          <option value="" disabled>
            Pilih sektor
          </option>
          <option value="manufaktur">Manufaktur</option>
          <option value="ritel">Ritel</option>
          <option value="logistik">Logistik</option>
          <option value="jasa">Jasa</option>
          <option value="teknologi">Teknologi</option>
          <option value="fmcg">FMCG</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className="text-xs font-medium tracking-wide text-(--color-muted)">
          Email kerja admin
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="hr@perusahaan.com"
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
        {submitting ? "Membuat akun…" : "Buat akun perusahaan"}
      </button>
    </form>
  );
}
