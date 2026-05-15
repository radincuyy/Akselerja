"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { setProfileVisibility } from "@/lib/profile-actions";

type Visibility = "applied-only" | "all-companies";

type Option = {
  value: Visibility;
  title: string;
  description: string;
};

const OPTIONS: Option[] = [
  {
    value: "applied-only",
    title: "Hanya perusahaan yang saya lamar",
    description:
      "Perusahaan baru bisa melihat profilmu setelah kamu mengirim lamaran ke lowongan mereka. Pilihan paling privat.",
  },
  {
    value: "all-companies",
    title: "Semua perusahaan terverifikasi",
    description:
      "HR yang berlangganan talent pool bisa menemukan profilmu lewat pencarian. Cocok kalau kamu sedang aktif mencari kerja.",
  },
];

export default function VisibilityForm({ initial }: { initial: Visibility }) {
  const [value, setValue] = useState<Visibility>(initial);
  const dirty = value !== initial;

  return (
    <form action={setProfileVisibility} className="mt-5 space-y-3">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={
              selected
                ? "flex cursor-pointer items-start gap-3 rounded-lg border border-(--color-teal) bg-(--color-tint) p-4"
                : "flex cursor-pointer items-start gap-3 rounded-lg border border-(--color-line) bg-(--color-paper) p-4 hover:border-(--color-ink)/40"
            }
          >
            <input
              type="radio"
              name="visibility"
              value={opt.value}
              checked={selected}
              onChange={() => setValue(opt.value)}
              className="mt-1 accent-(--color-teal)"
            />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-(--color-ink)">
                {opt.title}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-(--color-muted)">
                {opt.description}
              </span>
            </span>
          </label>
        );
      })}

      <div className="flex justify-end pt-1">
        <SaveButton disabled={!dirty} />
      </div>
    </form>
  );
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-50"
    >
      {pending ? "Menyimpan…" : "Simpan visibility"}
    </button>
  );
}
