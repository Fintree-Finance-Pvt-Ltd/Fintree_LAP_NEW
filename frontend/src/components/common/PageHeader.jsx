export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-bold text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

