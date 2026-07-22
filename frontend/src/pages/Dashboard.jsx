import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAdminBackgroundPoll } from "@/lib/adminPoll";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney, formatMoneyCompact } from "@/lib/formatMoney";
import StatCard from "@/components/StatCard";
import {
  Car, CarProfile, Wrench, Users, Calendar, CheckCircle, CurrencyDollar,
  Receipt, IdentificationCard, ChartLineUp, Eye
} from "@phosphor-icons/react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

function useChartHeights() {
  const [h, setH] = useState({ area: 240, pie: 200, bar: 220 });
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => {
      setH(mq.matches ? { area: 260, pie: 220, bar: 240 } : { area: 200, pie: 180, bar: 200 });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return h;
}

const COLORS = ["#E60000", "#0A0A0A", "#666666", "#FF3333", "#999999", "#CCCCCC"];

export default function Dashboard() {
  const { currency } = useBranding();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartHeights = useChartHeights();

  const loadStats = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/dashboard/stats");
      setStats(data);
    } catch {
      if (!silent) setStats(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useAdminBackgroundPoll(() => {
    loadStats({ silent: true });
  }, [loadStats]);

  if (loading || !stats) {
    return <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-mono py-20 text-center" data-testid="dashboard-loading">Loading dashboard...</div>;
  }

  const fmt = (n) => new Intl.NumberFormat("en-US").format(n);
  const fmtMoney = (n) => formatMoney(n, currency);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Top metrics */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-3">Operations Pulse</div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard testId="stat-total-cars" label="Total Cars" value={fmt(stats.total_cars)} icon={Car} sub="entire fleet" />
          <StatCard testId="stat-available" label="Available" value={fmt(stats.available_cars)} icon={CarProfile} sub="ready to rent" />
          <StatCard testId="stat-rented" label="Rented" value={fmt(stats.rented_cars)} icon={CarProfile} accent sub="currently out" />
          <StatCard testId="stat-maintenance" label="Maintenance" value={fmt(stats.maintenance_cars)} icon={Wrench} sub="under service" />
          <StatCard testId="stat-customers" label="Customers" value={fmt(stats.total_customers)} icon={Users} sub="registered" />
          <StatCard testId="stat-active-bookings" label="Active" value={fmt(stats.active_bookings)} icon={Calendar} accent sub="bookings live" />
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-3">Financial Snapshot</div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard testId="stat-completed" label="Completed Rentals" value={fmt(stats.completed_rentals)} icon={CheckCircle} sub="all time" />
          <StatCard testId="stat-pending-requests" label="Pending Requests" value={fmt(stats.pending_requests)} icon={Receipt} sub="awaiting approval" />
          <StatCard testId="stat-pending-payments" label="Pending Payments" value={fmt(stats.pending_payments)} icon={Receipt} sub="invoices open" />
          <StatCard testId="stat-revenue" label="Total Revenue" value={fmtMoney(stats.total_revenue)} icon={CurrencyDollar} accent sub="lifetime" />
          <StatCard testId="stat-drivers" label="Drivers Available" value={`${stats.available_drivers}/${stats.total_drivers}`} icon={IdentificationCard} sub="on duty" />
          <StatCard testId="stat-visitors" label="Site Visitors" value={fmt(stats.website_visitors)} icon={Eye} sub="this month" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="sharp-card p-4 sm:p-5 lg:col-span-2" data-testid="revenue-chart-card">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">Revenue trend</div>
              <div className="font-display mt-1 text-xl font-bold tracking-tight sm:text-2xl">Last 6 months</div>
            </div>
            <ChartLineUp size={20} className="shrink-0 text-[#E60000]" />
          </div>
          <ResponsiveContainer width="100%" height={chartHeights.area}>
            <AreaChart data={stats.revenue_chart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E60000" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#E60000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
              <XAxis dataKey="month" stroke="#999" fontSize={11} fontFamily="JetBrains Mono" />
              <YAxis stroke="#999" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={(v) => formatMoneyCompact(v, currency)} />
              <Tooltip
                formatter={(value) => [formatMoney(value, currency), "Revenue"]}
                contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", fontSize: 12, borderRadius: 2 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#E60000" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="sharp-card p-4 sm:p-5" data-testid="booking-status-chart-card">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-1">Booking status</div>
          <div className="font-display mb-4 text-xl font-bold tracking-tight sm:text-2xl">Distribution</div>
          <ResponsiveContainer width="100%" height={chartHeights.pie}>
            <PieChart>
              <Pie data={stats.booking_status_chart} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={45}>
                {stats.booking_status_chart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", textTransform: "uppercase" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="sharp-card p-4 sm:p-5 lg:col-span-2" data-testid="category-chart-card">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-1">Most booked</div>
          <div className="font-display mb-4 text-xl font-bold tracking-tight sm:text-2xl">Categories</div>
          <ResponsiveContainer width="100%" height={chartHeights.bar}>
            <BarChart data={stats.category_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
              <XAxis dataKey="category" stroke="#999" fontSize={11} fontFamily="JetBrains Mono" />
              <YAxis stroke="#999" fontSize={11} fontFamily="JetBrains Mono" />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", fontSize: 12 }} />
              <Bar dataKey="count" fill="#0A0A0A" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sharp-card p-5" data-testid="activity-log-card">
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-1">Recent activity</div>
          <div className="font-display font-bold text-2xl tracking-tight mb-4">Activity log</div>
          <div className="space-y-3 max-h-[260px] overflow-y-auto">
            {stats.activities.length === 0 && <div className="text-xs text-neutral-400 font-mono">No activity yet</div>}
            {stats.activities.map((a) => (
              <div key={a.id} className="text-xs border-l-2 border-[#E60000] pl-3 py-0.5">
                <div className="font-medium text-neutral-900">{a.action.replace(/_/g, " ")}</div>
                <div className="text-[10px] text-neutral-500 font-mono">{a.actor} · {new Date(a.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.most_rented && (
        <div className="sharp-card flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5" data-testid="most-rented-card">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">Most rented vehicle</div>
            <div className="font-display mt-1 text-xl font-bold tracking-tight sm:text-2xl">{stats.most_rented.name}</div>
            <div className="mt-1 text-xs text-neutral-500">{stats.most_rented.bookings} total bookings</div>
          </div>
          <Car size={48} weight="duotone" className="shrink-0 text-[#E60000]" />
        </div>
      )}
    </div>
  );
}
