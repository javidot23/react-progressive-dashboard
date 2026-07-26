export default function SummarySection() {
  return (
    <div>
      <h1 id="summary-heading" className="text-4xl font-bold text-slate-950">
        Competitor recall opens supply gap
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Summary loads immediately. The remaining sections are split into
        separate chunks and activate progressively.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["$1.16M", "Total sales YTD"],
          ["82%", "On-time in-full"],
          ["28/30", "Average days on hand"],
        ].map(([value, label]) => (
          <article
            key={label}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <p className="text-3xl font-bold">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 h-[520px] rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">OTIF performance</h2>
        <div className="mt-6 h-[420px] rounded-lg bg-gradient-to-b from-slate-100 to-slate-50" />
      </div>
    </div>
  );
}
