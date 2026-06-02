export default function DashboardLoading() {
  return (
    <>
      <section>
        <div className="shimmer-bg h-4 w-48 rounded" />
        <div className="shimmer-bg mt-3 h-8 w-80 max-w-full rounded" />
        <div className="shimmer-bg mt-3 h-4 w-96 max-w-full rounded" />
      </section>

      <section className="mt-10 rounded-[2rem] border border-slate-200/40 bg-white p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.025)]">
        <div className="flex items-center gap-6">
          <div className="shimmer-bg h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="shimmer-bg h-4 w-32 rounded" />
            <div className="shimmer-bg h-3 w-64 max-w-full rounded" />
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="shimmer-bg h-6 w-56 rounded" />
        <div className="mt-6 grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[2rem] border border-slate-200/40 bg-white p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="shimmer-bg h-12 w-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="shimmer-bg h-5 w-48 max-w-full rounded" />
                  <div className="shimmer-bg h-3 w-36 rounded" />
                  <div className="mt-3 flex gap-2">
                    <div className="shimmer-bg h-5 w-16 rounded-full" />
                    <div className="shimmer-bg h-5 w-20 rounded-full" />
                    <div className="shimmer-bg h-5 w-14 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
