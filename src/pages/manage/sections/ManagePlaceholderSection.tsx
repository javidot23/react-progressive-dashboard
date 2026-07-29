type ManagePlaceholderSectionProps = {
  description: string;
  id: string;
  title: string;
};

export function ManagePlaceholderSection({
  description,
  id,
  title,
}: ManagePlaceholderSectionProps) {
  return (
    <div>
      <h2
        id={`${id}-heading`}
        className="text-3xl font-bold text-slate-950"
      >
        {title}
      </h2>
      <p className="mt-2 text-slate-600">{description}</p>
      <div className="mt-6 h-[760px] rounded-xl border bg-white shadow-sm" />
    </div>
  );
}
