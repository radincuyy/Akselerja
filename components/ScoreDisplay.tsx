type Tone = "default" | "warning" | "low";

type Props = {
  score: number;
  label: string;
  explanation: string;
  action?: { label: string; href: string };
  size?: "sm" | "md" | "lg";
  tone?: Tone;
};

function toneClasses(score: number, tone?: Tone) {
  if (tone === "warning") return "text-(--color-signal-amber)";
  if (tone === "low") return "text-(--color-signal-clay)";
  if (score >= 75) return "text-(--color-teal)";
  if (score >= 50) return "text-(--color-signal-amber)";
  return "text-(--color-signal-clay)";
}

export default function ScoreDisplay({
  score,
  label,
  explanation,
  action,
  size = "md",
  tone,
}: Props) {
  const numberClass =
    size === "lg"
      ? "text-6xl sm:text-7xl"
      : size === "sm"
        ? "text-3xl"
        : "text-5xl";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className={`${numberClass} font-semibold leading-none tracking-tight tabular-nums ${toneClasses(score, tone)}`}
        >
          {score}
        </span>
        <span className="text-xl font-medium text-(--color-muted)">%</span>
      </div>
      <p className="max-w-md text-sm leading-relaxed text-(--color-ink)">
        {explanation}
      </p>
      {action && (
        <a
          href={action.href}
          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
        >
          {action.label}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3 7h8M8 4l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
