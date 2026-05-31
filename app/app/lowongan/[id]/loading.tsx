export default function JobDetailLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Memuat detail lowongan">
      <header className="border-b border-(--color-line) pb-6">
        <div className="h-4 w-24 animate-pulse rounded bg-(--color-tint)" />
        <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-(--color-tint)" />
        <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-(--color-tint)" />
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="h-4 animate-pulse rounded bg-(--color-tint)"
            />
          ))}
        </ul>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 animate-pulse rounded-full bg-(--color-tint)" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-(--color-tint)" />
                <div className="h-3 w-full animate-pulse rounded bg-(--color-tint)" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-(--color-tint)" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
            <div className="h-5 w-40 animate-pulse rounded bg-(--color-tint)" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-(--color-tint)" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-(--color-tint)" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-(--color-tint)" />
              <div className="h-3 w-9/12 animate-pulse rounded bg-(--color-tint)" />
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <div className="h-44 animate-pulse rounded-lg border border-(--color-line) bg-(--color-tint)" />
          <div className="h-64 animate-pulse rounded-lg border border-(--color-line) bg-(--color-tint)" />
        </aside>
      </div>
    </div>
  );
}
