import { levelLabel } from "@/lib/mock-data";

type Props = {
  name: string;
  level: 0 | 1 | 2 | 3;
  required?: 1 | 2 | 3;
};

export default function SkillBar({ name, level, required }: Props) {
  const pct = (level / 3) * 100;
  const reqPct = required ? (required / 3) * 100 : null;
  const meetsReq = required ? level >= required : true;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-(--color-ink)">{name}</span>
        <span
          className={
            meetsReq ? "text-(--color-muted)" : "text-(--color-signal-amber)"
          }
        >
          {levelLabel(level)}
          {required && !meetsReq && ` · butuh ${levelLabel(required)}`}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-(--color-line)">
        <div
          className={
            meetsReq
              ? "h-full rounded-full bg-(--color-teal)"
              : "h-full rounded-full bg-(--color-signal-amber)"
          }
          style={{ width: `${pct}%` }}
        />
        {reqPct !== null && (
          <div
            aria-hidden
            className="absolute inset-y-0 w-px bg-(--color-ink)/40"
            style={{ left: `${reqPct}%` }}
            title={`Dibutuhkan: ${levelLabel(required!)}`}
          />
        )}
      </div>
    </div>
  );
}
