"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  action: () => Promise<void>;
  triggerLabel: string;
  title: string;
  description: string;
  confirmKeyword: string;
  confirmCta: string;
};

export default function DangerConfirmForm({
  action,
  triggerLabel,
  title,
  description,
  confirmKeyword,
  confirmCta,
}: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === confirmKeyword.toLowerCase();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      // Focus the keyword input after panel mounts.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  function close() {
    setOpen(false);
    setTyped("");
    // Restore focus to the trigger.
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-(--color-signal-clay) px-4 py-2 text-sm font-medium text-(--color-signal-clay) hover:bg-(--color-tint)"
      >
        {triggerLabel}
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
      className="rounded-lg border border-(--color-signal-clay) bg-(--color-tint) p-5"
    >
      <p className="text-sm font-semibold text-(--color-ink)">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
        {description}
      </p>
      <form action={action} className="mt-4 space-y-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium tracking-wide text-(--color-muted)">
            Ketik <span className="font-mono text-(--color-ink)">{confirmKeyword}</span> untuk melanjutkan
          </span>
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-signal-clay)"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="flex flex-wrap gap-3 pt-2">
          <SubmitButton disabled={!matches} label={confirmCta} />
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-muted) hover:text-(--color-ink)"
          >
            Batal
          </button>
        </div>
        <p className="text-xs text-(--color-muted)">
          Tekan <kbd className="rounded border border-(--color-line) bg-(--color-paper) px-1 font-mono text-[11px] text-(--color-ink)">Esc</kbd> untuk membatalkan.
        </p>
      </form>
    </div>
  );
}

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md bg-(--color-signal-clay) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Menghapus…" : label}
    </button>
  );
}
