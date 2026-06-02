export default function CoachLoading() {
  return (
    <>
      <section>
        <div className="shimmer-bg h-3 w-16 rounded" />
        <div className="shimmer-bg mt-2 h-8 w-48 rounded" />
        <div className="shimmer-bg mt-2 h-4 w-72 max-w-full rounded" />
      </section>

      <div className="mt-8 rounded-[2rem] border border-slate-200/40 bg-white p-6 sm:p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`shimmer-bg rounded-2xl ${i % 2 === 0 ? "h-10 w-48" : "h-16 w-64 max-w-full"}`}
              />
            </div>
          ))}
        </div>
        <div className="shimmer-bg mt-6 h-12 w-full rounded-xl" />
      </div>
    </>
  );
}
