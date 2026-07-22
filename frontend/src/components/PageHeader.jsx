import { Plus } from "@phosphor-icons/react";

export function PageHeader({ title, description, action, actionLabel = "Add New", actionTestId, children }) {
  return (
    <div
      className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
      data-testid="page-header"
    >
      <div className="min-w-0">
        <h2 className="font-display text-2xl font-bold leading-none tracking-tighter sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-xs text-neutral-500">{description}</p>}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {children}
        {action && (
          <button
            type="button"
            onClick={action}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-sm bg-[#E60000] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#CC0000] sm:w-auto sm:justify-center"
            data-testid={actionTestId || "page-action-button"}
          >
            <Plus size={14} weight="bold" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status, color }) {
  const map = {
    available: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rented: "bg-blue-50 text-blue-700 border-blue-200",
    reserved: "bg-violet-50 text-violet-700 border-violet-200",
    maintenance: "bg-amber-50 text-amber-700 border-amber-200",
    out_of_service: "bg-neutral-100 text-neutral-700 border-neutral-300",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    ongoing: "bg-violet-50 text-violet-700 border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-neutral-100 text-neutral-700 border-neutral-300",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-neutral-100 text-neutral-700 border-neutral-300",
  };
  const cls = color || map[status] || "bg-neutral-100 text-neutral-700 border-neutral-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${cls}`}>
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

export function EmptyState({ message = "No records found", testId = "empty-state" }) {
  return (
    <div className="text-center py-16 text-xs text-neutral-500 font-mono uppercase tracking-wider" data-testid={testId}>
      {message}
    </div>
  );
}
