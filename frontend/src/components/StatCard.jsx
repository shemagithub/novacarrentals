export default function StatCard({ label, value, sub, accent = false, trend, icon: Icon, testId }) {
  return (
    <div className="sharp-card p-4 sm:p-5" data-testid={testId}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-[10px] font-semibold uppercase leading-tight tracking-[0.2em] text-neutral-500">{label}</div>
        {Icon && <Icon size={16} className={`shrink-0 ${accent ? "text-[#E60000]" : "text-neutral-400"}`} />}
      </div>
      <div
        className={`mt-2 min-w-0 break-words font-mono text-2xl font-bold leading-none tracking-tighter sm:mt-3 sm:text-[28px] md:text-[32px] ${accent ? "text-[#E60000]" : "text-neutral-900"}`}
        data-testid={`${testId}-value`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-2 text-[11px] text-neutral-500 flex items-center gap-1">
          {trend && <span className={trend > 0 ? "text-[#00C853]" : "text-[#E60000]"}>{trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%</span>}
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}
