export function SectionSkeleton({
  label,
  minHeight,
}: {
  label: string;
  minHeight: number;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={`Loading ${label}`}
      className="animate-pulse rounded-xl border border-slate-200 bg-white p-6"
      style={{ minHeight }}
    >
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="h-32 rounded bg-slate-100" />
        <div className="h-32 rounded bg-slate-100" />
        <div className="h-32 rounded bg-slate-100" />
      </div>
      <span className="sr-only">Loading {label}</span>
    </div>
  );
}
