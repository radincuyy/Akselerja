type Props = {
  title: string;
  description: string;
  variant?: "centered" | "roadmap";
};

export default function GenerationLoadingState({
  title,
  description,
  variant = "centered",
}: Props) {
  if (variant === "roadmap") {
    return <RoadmapSkeleton title={title} description={description} />;
  }
  return (
    <div
      className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="h-9 w-9 animate-spin rounded-full border-2 border-(--color-line) border-t-(--color-teal)"
      />
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-(--color-ink)">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
        {description}
      </p>
    </div>
  );
}

function RoadmapSkeleton({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-(--color-line) border-t-(--color-teal)"
        />
        <p className="text-xs font-medium uppercase tracking-wider text-(--color-teal)">
          Belajar
        </p>
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
        {description}
      </p>

      <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
        <div className="flex items-baseline justify-between gap-3">
          <SkeletonBar w="w-32" h="h-3" />
          <SkeletonBar w="w-24" h="h-3" />
        </div>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <SkeletonBar w="w-64" h="h-7" />
            <SkeletonBar w="w-48" h="h-4" />
          </div>
          <div className="w-full max-w-sm space-y-3">
            <SkeletonBar w="w-20" h="h-3" />
            <SkeletonBar w="w-16" h="h-9" />
            <div className="h-2 w-full overflow-hidden rounded-full bg-(--color-tint)">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-(--color-line)" />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>

      <div className="mt-12 space-y-3">
        <SkeletonBar w="w-44" h="h-6" />
        <SkeletonBar w="w-72" h="h-4" />
      </div>
      <ol className="mt-6 grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
          >
            <SkeletonBar w="w-16" h="h-5" />
            <div className="mt-4 space-y-2">
              <SkeletonBar w="w-3/4" h="h-5" />
              <SkeletonBar w="w-full" h="h-4" />
              <SkeletonBar w="w-5/6" h="h-4" />
            </div>
            <div className="mt-4 h-12 rounded-md bg-(--color-tint)" />
            <div className="mt-4 h-9 rounded-md bg-(--color-tint)" />
          </li>
        ))}
      </ol>
    </div>
  );
}

function SkeletonBar({ w, h }: { w: string; h: string }) {
  return (
    <span
      aria-hidden
      className={`block ${w} ${h} animate-pulse rounded bg-(--color-tint)`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-md border border-(--color-line) bg-(--color-tint) p-4">
      <SkeletonBar w="w-24" h="h-3" />
      <ul className="mt-3 space-y-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 py-1"
          >
            <SkeletonBar w="w-32" h="h-4" />
            <SkeletonBar w="w-20" h="h-5" />
          </li>
        ))}
      </ul>
    </div>
  );
}
