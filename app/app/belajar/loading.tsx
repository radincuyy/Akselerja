export default function BelajarLoading() {
  return (
    <>
      <section>
        <div className="shimmer-bg h-3 w-16 rounded" />
        <div className="shimmer-bg mt-2 h-8 w-64 rounded" />
        <div className="shimmer-bg mt-2 h-4 w-96 max-w-full rounded" />
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/40 bg-white p-5"
          >
            <div className="shimmer-bg h-4 w-16 rounded-full" />
            <div className="shimmer-bg mt-3 h-5 w-full rounded" />
            <div className="shimmer-bg mt-2 h-4 w-3/4 rounded" />
            <div className="mt-4 flex gap-2">
              <div className="shimmer-bg h-6 w-14 rounded-full" />
              <div className="shimmer-bg h-6 w-18 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
