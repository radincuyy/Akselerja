import { scoreBandLabel, type ScoreAudience } from "@/lib/format";

type Tone = "default" | "warning" | "low";

type Props = {
  score: number;
  label: string;
  explanation: string;
  action?: { label: string; href: string };
  size?: "sm" | "md" | "lg";
  tone?: Tone;
  audience?: ScoreAudience;
  showBand?: boolean;
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
  audience = "candidate",
  showBand: shouldShowBand,
}: Props) {
  const numberClass =
    size === "lg"
      ? "text-6xl sm:text-7xl"
      : size === "sm"
        ? "text-3xl"
        : "text-5xl";
  const tones = toneClasses(score, tone);
  // Only show band label when tone is auto (score-driven), not for explicit
  // warning/low tones used for non-match meanings.
  const showBand =
    shouldShowBand ?? (tone === undefined || tone === "default");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-(--color-muted)">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`${numberClass} font-semibold leading-none tracking-tight tabular-nums ${tones}`}
          >
            {score}
          </span>
          <span className="text-xl font-medium text-(--color-muted)">%</span>
        </div>
        {showBand ? (
          <span className="text-sm font-medium text-(--color-muted)">
            {scoreBandLabel(score, audience)}
          </span>
        ) : null}
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
