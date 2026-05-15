import type { ApplicationStatus } from "@/lib/types";
import { statusLabel } from "@/lib/applications-store";

type Variant = "chip" | "inline";
type Size = "sm" | "md";

const tone: Record<ApplicationStatus, { fg: string; bg: string }> = {
  submitted: {
    fg: "text-(--color-muted)",
    bg: "bg-(--color-tint)",
  },
  reviewing: {
    fg: "text-(--color-signal-amber)",
    bg: "bg-(--color-tint)",
  },
  invited: {
    fg: "text-(--color-teal)",
    bg: "bg-(--color-teal-soft)",
  },
  accepted: {
    fg: "text-(--color-signal-green)",
    bg: "bg-(--color-tint)",
  },
  rejected: {
    fg: "text-(--color-signal-clay)",
    bg: "bg-(--color-tint)",
  },
};

function Icon({ status }: { status: ApplicationStatus }) {
  const props = {
    width: 12,
    height: 12,
    viewBox: "0 0 12 12",
    fill: "none",
    "aria-hidden": true as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (status) {
    case "submitted":
      return (
        <svg {...props}>
          <path d="M2.5 3.5h7l-3.5 3-3.5-3zM2.5 3.5v5h7v-5" />
        </svg>
      );
    case "reviewing":
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="3.2" />
          <path d="M9.5 9.5 8 8" />
        </svg>
      );
    case "invited":
      return (
        <svg {...props}>
          <path d="M2.5 6h7M7 3.5 9.5 6 7 8.5" />
        </svg>
      );
    case "accepted":
      return (
        <svg {...props}>
          <path d="M2.5 6.5 5 9l4.5-5.5" />
        </svg>
      );
    case "rejected":
      return (
        <svg {...props}>
          <path d="M3.5 3.5 8.5 8.5M8.5 3.5 3.5 8.5" />
        </svg>
      );
  }
}

export default function StatusBadge({
  status,
  variant = "chip",
  size = "md",
}: {
  status: ApplicationStatus;
  variant?: Variant;
  size?: Size;
}) {
  const t = tone[status];
  const label = statusLabel(status);
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium ${t.fg}`}>
        <Icon status={status} />
        {label}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${t.bg} ${t.fg}`}
    >
      <Icon status={status} />
      {label}
    </span>
  );
}
