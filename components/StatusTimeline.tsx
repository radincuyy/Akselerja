import type { Application, ApplicationStatus } from "@/lib/types";
import { formatDateId, formatRelativeId } from "@/lib/mock-data";
import { statusLabel, statusOrder } from "@/lib/applications-store";

type Step = {
  key: ApplicationStatus;
  state: "done" | "active" | "pending";
  at?: string;
  copy: string;
};

function describe(status: ApplicationStatus, companyName: string): string {
  switch (status) {
    case "submitted":
      return `Lamaranmu masuk ke ${companyName}.`;
    case "reviewing":
      return `${companyName} sedang membaca profilmu.`;
    case "invited":
      return "Kamu diundang interview. HR akan menghubungi via email atau WhatsApp.";
    case "accepted":
      return `Selamat, ${companyName} memutuskan menerima kamu.`;
    case "rejected":
      return "Untuk lamaran ini, kamu belum dipilih.";
  }
}

export default function StatusTimeline({
  application,
  companyName,
}: {
  application: Application;
  companyName: string;
}) {
  const isRejected = application.status === "rejected";
  const order = statusOrder();

  const stepsForOrder: Step[] = order.map((key) => {
    const event = application.history.find((h) => h.status === key);
    const reachedIdx = order.findIndex((s) => s === application.status);
    const myIdx = order.findIndex((s) => s === key);
    let state: Step["state"] = "pending";
    if (!isRejected) {
      if (event) state = "done";
      if (key === application.status) state = "active";
      if (myIdx < reachedIdx) state = "done";
    } else {
      // For rejected, show submitted/reviewing as done if their events exist.
      if (event) state = "done";
      else state = "pending";
    }
    return {
      key,
      state,
      at: event?.at,
      copy: describe(key, companyName),
    };
  });

  // If rejected, append the rejected step as the final active node.
  const rejectedEvent = application.history.find((h) => h.status === "rejected");
  const steps: Step[] = isRejected
    ? [
        ...stepsForOrder.filter((s) => s.key === "submitted" || s.key === "reviewing"),
        {
          key: "rejected",
          state: "active",
          at: rejectedEvent?.at,
          copy: describe("rejected", companyName),
        },
      ]
    : stepsForOrder;

  return (
    <ol
      aria-label="Riwayat status lamaran"
      className="relative grid gap-5 md:grid-cols-4"
    >
      {steps.map((step, i) => (
        <li key={step.key} className="relative flex items-start gap-3 md:flex-col md:items-stretch">
          <div className="flex shrink-0 items-center md:block">
            <Dot state={step.state} status={step.key} />
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={
                  step.state === "done"
                    ? "ml-3 hidden h-px w-full bg-(--color-teal) md:absolute md:left-9 md:top-3 md:ml-0 md:block md:w-[calc(100%-2.25rem)]"
                    : "ml-3 hidden h-px w-full bg-(--color-line) md:absolute md:left-9 md:top-3 md:ml-0 md:block md:w-[calc(100%-2.25rem)]"
                }
              />
            )}
          </div>
          <div className="min-w-0 flex-1 md:mt-3">
            <p
              className={
                step.state === "active"
                  ? step.key === "rejected"
                    ? "text-sm font-semibold text-(--color-signal-clay)"
                    : "text-sm font-semibold text-(--color-ink)"
                  : step.state === "done"
                    ? "text-sm font-medium text-(--color-ink)"
                    : "text-sm font-medium text-(--color-muted)"
              }
            >
              {statusLabel(step.key)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-(--color-muted)">
              {step.copy}
            </p>
            {step.at ? (
              <p className="mt-1 text-[11px] text-(--color-muted)">
                {formatDateId(step.at)} <span aria-hidden>·</span> {formatRelativeId(step.at)}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Dot({
  state,
  status,
}: {
  state: Step["state"];
  status: ApplicationStatus;
}) {
  if (state === "done") {
    return (
      <span
        aria-hidden
        className="flex h-6 w-6 items-center justify-center rounded-full bg-(--color-teal) text-(--color-paper-on-teal)"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M2.5 5.5 4.5 7.5 8.5 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    if (status === "rejected") {
      return (
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-(--color-signal-clay) bg-(--color-paper) text-(--color-signal-clay)"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2.5 2.5 7.5 7.5M7.5 2.5 2.5 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      );
    }
    return (
      <span aria-hidden className="relative flex h-6 w-6 items-center justify-center">
        <span className="relative inline-flex h-3 w-3 rounded-full bg-(--color-teal)" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 items-center justify-center rounded-full border border-(--color-line) bg-(--color-paper)"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-(--color-line)" />
    </span>
  );
}
