export default function ProfilLoading() {
  return (
    <>
      <section>
        <div className="shimmer-bg h-3 w-16 rounded" />
        <div className="shimmer-bg mt-2 h-8 w-48 rounded" />
        <div className="shimmer-bg mt-2 h-4 w-80 max-w-full rounded" />
      </section>

      <div className="mt-8 rounded-[2rem] border border-slate-200/40 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-5">
          <div className="shimmer-bg h-16 w-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="shimmer-bg h-6 w-40 rounded" />
            <div className="shimmer-bg h-4 w-56 max-w-full rounded" />
            <div className="shimmer-bg h-4 w-32 rounded" />
          </div>
        </div>
      </div>

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="mt-8 rounded-[2rem] border border-slate-200/40 bg-white p-6 sm:p-8"
        >
          <div className="shimmer-bg h-5 w-32 rounded" />
          <div className="mt-4 space-y-3">
            <div className="shimmer-bg h-4 w-full rounded" />
            <div className="shimmer-bg h-4 w-3/4 rounded" />
            <div className="shimmer-bg h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
