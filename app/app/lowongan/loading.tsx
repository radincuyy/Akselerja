import PageHeader from "@/components/layout/PageHeader";

export default function LowonganLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Lowongan"
        title="Lowongan yang cocok denganmu"
        description="Memuat data lowongan..."
      />

      <div className="mt-8 max-w-2xl">
        <div className="shimmer-bg h-11 w-full rounded-xl" />
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[18rem_1fr] lg:gap-8 lg:items-start">
        <div className="hidden lg:block">
          <div className="space-y-4 rounded-2xl border border-slate-200/40 bg-white p-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="shimmer-bg h-4 w-20 rounded" />
                <div className="shimmer-bg h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="shimmer-bg mb-4 h-4 w-48 rounded" />
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-[2rem] border border-slate-200/40 bg-white p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="shimmer-bg h-12 w-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="shimmer-bg h-5 w-56 max-w-full rounded" />
                    <div className="shimmer-bg h-3 w-40 rounded" />
                    <div className="mt-3 flex gap-2">
                      <div className="shimmer-bg h-5 w-16 rounded-full" />
                      <div className="shimmer-bg h-5 w-20 rounded-full" />
                    </div>
                    <div className="shimmer-bg mt-2 h-4 w-36 rounded" />
                  </div>
                  <div className="text-right">
                    <div className="shimmer-bg h-7 w-12 rounded" />
                    <div className="shimmer-bg mt-1 h-3 w-16 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
