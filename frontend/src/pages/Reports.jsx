import { useCallback, useEffect, useState } from "react";
import api, { API_BASE } from "@/lib/api";
import { useAdminBackgroundPoll } from "@/lib/adminPoll";
import { PageHeader } from "@/components/PageHeader";
import { FilePdf, FileXls, FileCsv, Download } from "@phosphor-icons/react";
import StatCard from "@/components/StatCard";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney } from "@/lib/formatMoney";

const RESOURCES = [
  { key: "vehicles", label: "Vehicles" },
  { key: "bookings", label: "Bookings" },
  { key: "customers", label: "Customers" },
  { key: "drivers", label: "Drivers" },
  { key: "payments", label: "Payments" },
  { key: "maintenance", label: "Maintenance" },
  { key: "promotions", label: "Promotions" },
  { key: "reviews", label: "Reviews" },
  { key: "branches", label: "Branches" },
  { key: "tickets", label: "Tickets" },
];

export default function Reports() {
  const { currency } = useBranding();
  const [financial, setFinancial] = useState(null);
  const [operational, setOperational] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      const [f, o] = await Promise.all([
        api.get("/reports/financial"),
        api.get("/reports/operational"),
      ]);
      setFinancial(f.data);
      setOperational(o.data);
    } catch {
      /* keep prior snapshot on background refresh */
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useAdminBackgroundPoll(() => {
    loadReports();
  }, [loadReports]);

  const downloadExport = async (resource, fmt) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/exports/${resource}.${fmt}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resource}_export.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${resource} exported as ${fmt.toUpperCase()}`);
    } catch (e) {
      toast.error(`Failed to export ${resource}`);
    }
  };

  return (
    <div data-testid="reports-page">
      <PageHeader title="Reports & Analytics" description="Financial and operational reports — export any dataset as PDF, Excel, or CSV." />

      <div className="space-y-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-3">Financial Snapshot</div>
          {financial ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-4">
              <StatCard testId="report-revenue" label="Total Revenue" value={formatMoney(financial.total_revenue, currency)} accent />
              <StatCard testId="report-deposits" label="Deposits" value={formatMoney(financial.deposits, currency)} />
              <StatCard testId="report-refunds" label="Refunds" value={formatMoney(financial.total_refunds, currency)} />
              <StatCard testId="report-net" label="Net" value={formatMoney(financial.net, currency)} />
              <StatCard testId="report-tax" label="Est. Tax (18%)" value={formatMoney(financial.tax_estimate, currency)} />
            </div>
          ) : <div className="text-xs text-neutral-500 font-mono">Loading...</div>}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-3">Operational Snapshot</div>
          {operational ? (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
              <StatCard testId="report-bookings" label="Total Bookings" value={operational.total_bookings} />
              <StatCard testId="report-utilization" label="Vehicle Utilization" value={`${operational.vehicle_utilization_pct}%`} accent />
              <StatCard testId="report-avg-value" label="Avg Booking Value" value={formatMoney(operational.avg_booking_value, currency)} />
            </div>
          ) : <div className="text-xs text-neutral-500 font-mono">Loading...</div>}
        </div>

        <div className="sharp-card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">Data Export</div>
              <div className="font-display text-lg font-bold tracking-tight sm:text-xl">Download datasets</div>
            </div>
            <Download size={18} className="shrink-0 text-neutral-400" />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[320px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Dataset</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Formats</th>
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map(r => (
                <tr key={r.key} className="border-b border-neutral-100" data-testid={`export-row-${r.key}`}>
                  <td className="px-5 py-3 text-sm font-medium">{r.label}</td>
                  <td className="px-3 py-2 text-right sm:px-5">
                    <div className="inline-flex flex-wrap justify-end gap-1.5">
                      <ExportBtn icon={FilePdf} label="PDF" onClick={() => downloadExport(r.key, "pdf")} testId={`export-${r.key}-pdf`} />
                      <ExportBtn icon={FileXls} label="Excel" onClick={() => downloadExport(r.key, "xlsx")} testId={`export-${r.key}-xlsx`} />
                      <ExportBtn icon={FileCsv} label="CSV" onClick={() => downloadExport(r.key, "csv")} testId={`export-${r.key}-csv`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportBtn({ icon: Icon, label, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[40px] items-center gap-1.5 rounded-sm border border-neutral-300 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors hover:border-[#E60000] hover:bg-neutral-100 hover:text-[#E60000] sm:min-h-0 sm:px-3"
      data-testid={testId}
    >
      <Icon size={12} /> {label}
    </button>
  );
}
