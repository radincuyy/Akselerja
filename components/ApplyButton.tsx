"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { applyToJob } from "@/lib/actions";

type Props = {
  jobId: string;
  alreadyAppliedHref?: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-3 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-70"
    >
      {pending ? (
        <>
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--color-paper-on-teal)/40 border-t-(--color-paper-on-teal)"
          />
          Mengirim lamaran…
        </>
      ) : (
        "Lamar posisi ini"
      )}
    </button>
  );
}

export default function ApplyButton({ jobId, alreadyAppliedHref }: Props) {
  if (alreadyAppliedHref) {
    return (
      <Link
        href={alreadyAppliedHref}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-(--color-teal) bg-(--color-teal-soft) px-5 py-3 text-sm font-semibold text-(--color-teal-deep) hover:bg-(--color-tint)"
      >
        Sudah dilamar, lihat status →
      </Link>
    );
  }

  return (
    <form action={applyToJob.bind(null, jobId)}>
      <SubmitButton />
    </form>
  );
}
