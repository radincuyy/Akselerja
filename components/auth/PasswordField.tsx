"use client";

import { useState } from "react";
import { getPasswordChecks, isPasswordValid } from "@/lib/auth/password-rules";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  showInvalid?: boolean;
  showRequirements?: boolean;
};

type Tone = "neutral" | "success" | "danger" | "warning";

function toneTextClass(tone: Tone): string {
  if (tone === "success") return "text-(--color-signal-green)";
  if (tone === "danger") return "text-(--color-signal-clay)";
  if (tone === "warning") return "text-(--color-signal-amber)";
  return "text-(--color-ink)";
}

function inputBorderClass(tone: Tone): string {
  if (tone === "success") {
    return "border-(--color-signal-green) focus:border-(--color-signal-green)";
  }
  if (tone === "danger") {
    return "border-(--color-signal-clay) focus:border-(--color-signal-clay)";
  }
  if (tone === "warning") {
    return "border-(--color-signal-amber) focus:border-(--color-signal-amber)";
  }
  return "border-(--color-line) focus:border-(--color-teal)";
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.6a2.5 2.5 0 0 0 2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.4 6.8C3.9 8.5 2.5 12 2.5 12s3.5 6 9.5 6c1.9 0 3.6-.6 5-1.4M9.8 6.2c.7-.1 1.4-.2 2.2-.2 6 0 9.5 6 9.5 6s-.8 1.4-2.3 2.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusIcon({ tone }: { tone: Tone }) {
  if (tone === "warning") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 2.2 14.2 13H1.8L8 2.2Z" fill="currentColor" />
        <path
          d="M8 5.9v3.3M8 11.4h.01"
          stroke="var(--color-paper)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8.2 6.3 11.5 13 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  autoComplete,
  placeholder,
  required,
  showInvalid = false,
  showRequirements = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const checks = getPasswordChecks(value);
  const valid = isPasswordValid(value);
  const shouldWarn = showRequirements && showInvalid && !value;
  const shouldShowError = showRequirements && showInvalid && value && !valid;
  const inputTone: Tone = shouldWarn
    ? "warning"
    : shouldShowError
      ? "danger"
      : showRequirements && value && valid
        ? "success"
        : "neutral";
  const status = shouldWarn
    ? { tone: "warning" as const, label: "Password wajib diisi." }
    : shouldShowError
      ? { tone: "danger" as const, label: "Password belum memenuhi kriteria." }
      : null;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-wide text-(--color-muted)"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          value={value}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={8}
          placeholder={placeholder}
          aria-invalid={shouldWarn || shouldShowError ? true : undefined}
          className={`w-full rounded-md border bg-(--color-paper) px-3.5 py-2.5 pr-11 text-base text-(--color-ink) placeholder:text-(--color-muted) transition-colors ${inputBorderClass(inputTone)}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-md text-(--color-muted) transition-colors hover:text-(--color-ink)"
        >
          <EyeIcon open={visible} />
        </button>
      </div>

      {status ? (
        <p
          role="alert"
          className={`mt-1 flex items-center gap-2 text-sm ${toneTextClass(status.tone)}`}
        >
          <StatusIcon tone={status.tone} />
          <span>{status.label}</span>
        </p>
      ) : null}

      {showRequirements ? (
        <div className="mt-1">
          <p className="text-xs font-medium text-(--color-muted)">
            Kriteria password
          </p>
          <ul className="mt-1.5 grid gap-1.5">
            {checks.map((check) => {
              const tone: Tone =
                value && check.met
                  ? "success"
                  : showInvalid && value && !check.met
                    ? "danger"
                    : "neutral";
              return (
                <li
                  key={check.id}
                  className={`flex items-center gap-2 text-sm ${toneTextClass(tone)}`}
                >
                  <StatusIcon tone={tone} />
                  <span>{check.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
