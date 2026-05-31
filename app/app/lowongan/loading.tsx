import PageHeader from "@/components/layout/PageHeader";

export default function LowonganLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Memuat lowongan">
      <PageHeader
        eyebrow="Lowongan"
        title="Lowongan yang cocok denganmu"
        description="Sedang menyusun urutan lowongan berdasarkan profil dan match score."
      />

      <div className="mt-8 max-w-2xl">
        <div className="h-11 animate-pulse rounded-lg border border-(--color-line) bg-(--color-tint)" />
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[18rem_1fr] lg:gap-8 lg:items-start">
        <div className="hidden lg:sticky lg:top-16 lg:block">
          <div className="h-96 animate-pulse rounded-lg border border-(--color-line) bg-(--color-tint)" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-md bg-(--color-tint)" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-(--color-tint)" />
                  <div className="h-4 w-1/2 rounded bg-(--color-tint)" />
                  <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                    <div className="h-3 rounded bg-(--color-tint)" />
                    <div className="h-3 rounded bg-(--color-tint)" />
                  </div>
                </div>
                <div className="hidden h-14 w-14 shrink-0 rounded-full bg-(--color-tint) sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
