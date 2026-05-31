type Skill = {
  name: string;
  state: "match" | "improve" | "missing";
};

const skills: Skill[] = [
  { name: "Microsoft Excel", state: "match" },
  { name: "Inventory Management", state: "improve" },
  { name: "Warehouse Management System", state: "missing" },
];

function StateIcon({ state }: { state: Skill["state"] }) {
  if (state === "match") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none">
        <path
          d="M3 7.5l2.5 2.5L11 4.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (state === "improve") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none">
        <path
          d="M7 11V3M3.5 6.5 7 3l3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden fill="none">
      <path
        d="M3 7h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function stateLabel(state: Skill["state"]) {
  if (state === "match") return "Sudah cocok";
  if (state === "improve") return "Perlu ditingkatkan";
  return "Belum ada";
}

function stateColors(state: Skill["state"]) {
  if (state === "match") {
    return "bg-(--color-tint) text-(--color-signal-green) border border-(--color-line)";
  }
  if (state === "improve") {
    return "bg-(--color-tint) text-(--color-signal-amber) border border-(--color-line)";
  }
  return "bg-(--color-tint) text-(--color-signal-clay) border border-(--color-line)";
}

export default function MatchScoreMock() {
  return (
    <figure
      aria-label="Contoh hasil match score Akselerja"
      className="relative isolate w-full max-w-md rounded-lg border border-(--color-line) bg-(--color-paper) p-6"
    >
      <div className="flex items-center justify-between text-xs font-medium tracking-wide text-(--color-muted)">
        <span>Contoh hasil match</span>
        <span className="rounded bg-(--color-tint) px-2 py-0.5">Demo</span>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-5xl font-semibold leading-none tracking-tight text-(--color-teal) tabular-nums">
          82
        </span>
        <span className="text-2xl font-medium text-(--color-muted)">%</span>
        <span className="ml-auto text-xs text-(--color-muted)">
          Junior Admin Gudang
        </span>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed text-(--color-ink)">
        Kamu cocok untuk posisi ini karena Excel dan pengalaman inventory.
        Untuk peluang lebih besar, pelajari dasar Warehouse Management System.
      </p>

      <div className="mt-5">
        <div
          aria-hidden
          className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-line)"
        >
          <div
            className="h-full rounded-full bg-(--color-teal)"
            style={{ width: "82%" }}
          />
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Status skill">
        {skills.map((skill) => (
          <li
            key={skill.name}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${stateColors(skill.state)}`}
          >
            <StateIcon state={skill.state} />
            <span className="text-(--color-ink)">{skill.name}</span>
            <span className="sr-only">, {stateLabel(skill.state)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between border-t border-(--color-line) pt-4 text-xs text-(--color-muted)">
        <span>Langkah berikutnya</span>
        <span className="font-medium text-(--color-ink)">
          Ikuti modul WMS dasar →
        </span>
      </div>
    </figure>
  );
}
