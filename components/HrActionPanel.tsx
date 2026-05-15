"use client";

import { useState, useTransition } from "react";
import {
  changeApplicationStatus,
  reopenApplication,
} from "@/lib/actions";
import type { ApplicationStatus, RejectReasonId } from "@/lib/types";
import {
  REJECT_REASONS,
  rejectReasonById,
  statusLabel,
} from "@/lib/applications-store";
import StatusBadge from "./StatusBadge";

type Props = {
  applicationId: string;
  status: ApplicationStatus;
  rejectReason?: RejectReasonId;
  candidateName: string;
  jobTitle: string;
};

type View = "menu" | "reject";

export default function HrActionPanel({
  applicationId,
  status,
  rejectReason,
  candidateName,
  jobTitle,
}: Props) {
  const [view, setView] = useState<View>("menu");
  const [isPending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<ApplicationStatus | "reopen" | null>(null);
  const [draftReason, setDraftReason] = useState<RejectReasonId | "">("");

  function move(target: ApplicationStatus) {
    setPendingTarget(target);
    startTransition(async () => {
      await changeApplicationStatus(applicationId, target);
      setPendingTarget(null);
    });
  }
  function submitReject() {
    if (!draftReason) return;
    setPendingTarget("rejected");
    startTransition(async () => {
      await changeApplicationStatus(applicationId, "rejected", draftReason);
      setPendingTarget(null);
      setView("menu");
    });
  }
  function reopen() {
    setPendingTarget("reopen");
    startTransition(async () => {
      await reopenApplication(applicationId);
      setPendingTarget(null);
    });
  }

  const isFinal = status === "accepted" || status === "rejected";

  if (isFinal) {
    const reason = rejectReason ? rejectReasonById(rejectReason) : undefined;
    return (
      <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
          Keputusan untuk lamaran ini
        </p>
        <div className="mt-2.5 flex items-center gap-2.5">
          <StatusBadge status={status} />
          {status === "rejected" && reason ? (
            <span className="text-sm text-(--color-muted)">
              Alasan: {reason.label}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
          {status === "accepted"
            ? `${candidateName} ditandai diterima untuk ${jobTitle}. Kandidat akan melihat status ini dan menunggu kabar dari kamu.`
            : `${candidateName} ditandai ditolak. Kandidat melihat alasan terstruktur di atas plus rekomendasi langkah berikutnya.`}
        </p>
        <button
          type="button"
          onClick={reopen}
          disabled={isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink) disabled:opacity-60"
        >
          {isPending && pendingTarget === "reopen" ? "Membuka kembali…" : "Buka kembali keputusan"}
        </button>
      </div>
    );
  }

  if (view === "reject") {
    const selected = rejectReasonById(draftReason || undefined);
    return (
      <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-(--color-ink)">
            Tolak dengan alasan
          </p>
          <button
            type="button"
            onClick={() => setView("menu")}
            className="text-xs text-(--color-muted) hover:text-(--color-ink)"
          >
            Batal
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
          Kandidat melihat alasan ini ditambah rekomendasi langkah berikutnya.
          Pilih satu yang paling tepat.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Alasan menolak</legend>
          {REJECT_REASONS.map((r) => {
            const checked = draftReason === r.id;
            return (
              <label
                key={r.id}
                className={
                  checked
                    ? "flex cursor-pointer items-start gap-3 rounded-md border border-(--color-teal) bg-(--color-tint) p-3 text-sm text-(--color-ink)"
                    : "flex cursor-pointer items-start gap-3 rounded-md border border-(--color-line) bg-(--color-paper) p-3 text-sm text-(--color-ink) hover:border-(--color-ink)/40"
                }
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.id}
                  checked={checked}
                  onChange={() => setDraftReason(r.id)}
                  className="mt-0.5 h-4 w-4 accent-(--color-teal)"
                />
                <span>{r.label}</span>
              </label>
            );
          })}
        </fieldset>
        {selected ? (
          <div className="mt-4 rounded-md bg-(--color-tint) p-3.5 text-xs leading-relaxed text-(--color-muted)">
            <p className="font-medium text-(--color-ink)">
              Pesan ke kandidat:
            </p>
            <p className="mt-1.5">{selected.candidateMessage}</p>
          </div>
        ) : null}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={submitReject}
            disabled={!draftReason || isPending}
            className="inline-flex items-center gap-2 rounded-md bg-(--color-signal-clay) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Mengirim…" : "Konfirmasi tolak"}
          </button>
          <p className="text-xs text-(--color-muted)">
            Status akan berubah jadi {statusLabel("rejected").toLowerCase()}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
        Keputusan
      </p>
      <div className="mt-2.5">
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
        Status ini juga dilihat oleh kandidat. Pindahkan saat kamu siap.
      </p>

      <div className="mt-5 grid gap-2">
        {status === "submitted" ? (
          <ActionButton
            label="Tandai sudah direview"
            target="reviewing"
            isPending={isPending && pendingTarget === "reviewing"}
            onClick={() => move("reviewing")}
          />
        ) : null}

        {status !== "invited" ? (
          <ActionButton
            label="Undang interview"
            target="invited"
            isPending={isPending && pendingTarget === "invited"}
            onClick={() => move("invited")}
            primary
          />
        ) : null}

        <ActionButton
          label="Tandai diterima"
          target="accepted"
          isPending={isPending && pendingTarget === "accepted"}
          onClick={() => move("accepted")}
          tone="green"
        />

        <ActionButton
          label="Tolak"
          target="rejected"
          isPending={false}
          onClick={() => setView("reject")}
          tone="clay"
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  isPending,
  onClick,
  primary,
  tone,
}: {
  label: string;
  target: ApplicationStatus;
  isPending: boolean;
  onClick: () => void;
  primary?: boolean;
  tone?: "green" | "clay";
}) {
  const className = primary
    ? "inline-flex items-center justify-between gap-2 rounded-md bg-(--color-teal) px-4 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-60"
    : tone === "green"
      ? "inline-flex items-center justify-between gap-2 rounded-md border border-(--color-line) px-4 py-2.5 text-sm font-medium text-(--color-signal-green) hover:border-(--color-signal-green) disabled:opacity-60"
      : tone === "clay"
        ? "inline-flex items-center justify-between gap-2 rounded-md border border-(--color-line) px-4 py-2.5 text-sm font-medium text-(--color-signal-clay) hover:border-(--color-signal-clay) disabled:opacity-60"
        : "inline-flex items-center justify-between gap-2 rounded-md border border-(--color-line) px-4 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink) disabled:opacity-60";

  return (
    <button type="button" onClick={onClick} disabled={isPending} className={className}>
      <span>{label}</span>
      {isPending ? (
        <span
          aria-hidden
          className="h-3 w-3 animate-spin rounded-full border-2 border-current/40 border-t-current"
        />
      ) : (
        <span aria-hidden className="opacity-50">
          →
        </span>
      )}
    </button>
  );
}
