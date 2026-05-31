type Props = {
  applyUrl?: string | null;
};

export default function ApplyButton({ applyUrl }: Props) {
  if (!applyUrl) {
    return (
      <div
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-(--color-paper-soft) px-5 py-3 text-sm font-medium text-(--color-muted)"
        aria-disabled
      >
        Tautan lamaran belum tersedia
      </div>
    );
  }

  return (
    <a
      href={applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-3 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep)"
    >
      Lamar di Glints
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M5 3h6v6M11 3 4 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
