import { useCallback, useEffect, useState } from "react";
import { useAdminBackgroundPoll } from "@/lib/adminPoll";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import api, { fileImageSrcFromStored } from "@/lib/api";
import { PageHeader, StatusBadge, EmptyState } from "@/components/PageHeader";
import {
  ArrowSquareOut,
  CalendarBlank,
  Table as TableIcon,
  CaretLeft,
  CaretRight,
  X,
} from "@phosphor-icons/react";
import ResourcePage from "@/components/ResourcePage";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney, currencyFieldSuffix } from "@/lib/formatMoney";

/** Prefer booking-time snapshots (e.g. public site), then linked customer record. */
function resolveBooker(booking, customersById) {
  const c = customersById?.[booking.customer_id];
  const name = (booking.guest_name_snapshot || c?.full_name || "").trim();
  const email = (booking.guest_email_snapshot || c?.email || "").trim();
  const phone = (booking.guest_phone_snapshot || c?.phone || "").trim();
  return {
    name: name || "—",
    email: email || "—",
    phone: phone || "—",
  };
}

function customersArrayToMap(list) {
  const m = {};
  (Array.isArray(list) ? list : []).forEach((c) => {
    if (c?.id) m[c.id] = c;
  });
  return m;
}

function vehiclesArrayToMap(list) {
  const m = {};
  (Array.isArray(list) ? list : []).forEach((v) => {
    if (v?.id) m[v.id] = v;
  });
  return m;
}

/** Label for the car on this booking: fleet record name, then snapshot from public booking, then id. */
function bookedVehicleDisplayName(booking, vehiclesById) {
  const v = vehiclesById?.[booking.vehicle_id];
  const fromFleet = (v?.name || "").trim();
  if (fromFleet) return fromFleet;
  const snap = (booking.vehicle_name_snapshot || "").trim();
  if (snap) return snap;
  const id = booking.vehicle_id || "";
  return id ? `${id.slice(0, 8)}…` : "—";
}

function firstVehicleImageRaw(vehicle) {
  if (!vehicle) return null;
  const hero = vehicle.image_url;
  if (hero != null && String(hero).trim() !== "") return String(hero).trim();
  const g = vehicle.gallery_images;
  if (Array.isArray(g)) {
    for (const x of g) {
      if (x != null && String(x).trim() !== "") return String(x).trim();
    }
  }
  return null;
}

function VehicleBookedModal({ open, onClose, booking, vehicle, currency }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !booking) return null;

  const title = bookedVehicleDisplayName(
    booking,
    vehicle ? { [vehicle.id]: vehicle } : {}
  );
  const imgRaw = vehicle ? firstVehicleImageRaw(vehicle) : null;
  const brandModel =
    vehicle && ((vehicle.brand || "") + " " + (vehicle.model_name || "")).trim()
      ? `${vehicle.brand || ""} ${vehicle.model_name || ""}`.trim()
      : "—";

  const rows = [
    { label: "Fleet name", value: vehicle?.name || "—" },
    { label: "Name at booking", value: (booking.vehicle_name_snapshot || "").trim() || "—" },
    { label: "Brand / model", value: brandModel },
    { label: "Category", value: vehicle?.category ?? "—" },
    { label: "Year", value: vehicle?.year != null ? String(vehicle.year) : "—" },
    { label: "Registration", value: vehicle?.registration_number ?? "—" },
    { label: "Fuel", value: vehicle?.fuel_type ?? "—" },
    { label: "Transmission", value: vehicle?.transmission ?? "—" },
    { label: "Seats", value: vehicle?.seats != null ? String(vehicle.seats) : "—" },
    {
      label: "Daily rate",
      value: vehicle?.daily_rate != null ? formatMoney(vehicle.daily_rate, currency) : "—",
    },
    { label: "Status", value: vehicle?.status ?? "—" },
    { label: "Mileage (odometer)", value: vehicle?.mileage != null ? String(vehicle.mileage) : "—" },
    { label: "Condition", value: vehicle?.condition ?? "—" },
    { label: "Vehicle ID", value: booking.vehicle_id || "—" },
  ];

  const features = vehicle?.features;
  const featuresLine =
    Array.isArray(features) && features.length ? features.join(", ") : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[6200] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-2 pt-4 pb-10 backdrop-blur-[2px] sm:p-4 sm:pt-6 sm:pb-12"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      data-testid="booked-vehicle-modal-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booked-vehicle-modal-title"
        className="my-1 flex max-h-[calc(100svh-2.5rem)] w-full max-w-lg min-h-0 flex-col overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/[0.04] sm:my-2 sm:max-h-[min(92svh,880px)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Booked vehicle</div>
            <h2 id="booked-vehicle-modal-title" className="font-display text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
              {title}
            </h2>
            <p className="mt-1 text-[11px] text-neutral-500">
              Pickup {(booking.pickup_date || "").slice(0, 10)} → Return {(booking.return_date || "").slice(0, 10)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-sm text-neutral-600 hover:bg-neutral-100 sm:min-h-0 sm:min-w-0 sm:p-2"
            aria-label="Close"
            data-testid="booked-vehicle-modal-close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {!vehicle && (
            <div className="mb-4 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
              No matching vehicle found in the fleet (it may have been removed). Details below use the booking record only.
            </div>
          )}

          {imgRaw && (
            <div className="mb-4 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50">
              <img
                src={fileImageSrcFromStored(imgRaw)}
                alt=""
                className="max-h-52 w-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <dl className="space-y-3">
            {rows.map(({ label, value }) => (
              <div key={label} className="grid grid-cols-[minmax(0,38%)_1fr] gap-x-3 gap-y-0.5 text-xs sm:text-sm">
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</dt>
                <dd className="break-words font-medium text-neutral-900">{value}</dd>
              </div>
            ))}
          </dl>

          {featuresLine && (
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Features</div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-800">{featuresLine}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 bg-neutral-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {vehicle?.id ? (
            <Link
              to={`/vehicles/${vehicle.id}`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 sm:min-h-0"
              onClick={onClose}
              data-testid="booked-vehicle-open-full"
            >
              <span>Open vehicle page</span>
              <ArrowSquareOut size={16} className="text-neutral-600" />
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-sm bg-[#E60000] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-red-700 sm:min-h-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Bookings() {
  const [view, setView] = useState("table");

  return (
    <div data-testid="bookings-page-wrapper">
      <div className="-mt-2 mb-3 flex justify-stretch sm:justify-end">
        <div className="inline-flex w-full overflow-hidden rounded-sm border border-neutral-300 sm:w-auto">
          <button
            onClick={() => setView("table")}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider sm:min-h-0 sm:flex-initial ${view === "table" ? "bg-[#E60000] text-white" : "bg-white text-neutral-700 hover:bg-neutral-50"}`}
            data-testid="bookings-view-table"
          >
            <TableIcon size={12} /> Table
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider sm:min-h-0 sm:flex-initial ${view === "calendar" ? "bg-[#E60000] text-white" : "bg-white text-neutral-700 hover:bg-neutral-50"}`}
            data-testid="bookings-view-calendar"
          >
            <CalendarBlank size={12} /> Calendar
          </button>
        </div>
      </div>

      {view === "table" ? <BookingsTable /> : <BookingsCalendar />}
    </div>
  );
}

function BookingsTable() {
  const { currency } = useBranding();
  const sfx = currencyFieldSuffix(currency);
  const [customersById, setCustomersById] = useState({});
  const [vehiclesById, setVehiclesById] = useState({});
  const [vehiclePreview, setVehiclePreview] = useState(null);

  const refetchRelated = useCallback(() => {
    Promise.all([api.get("/customers"), api.get("/vehicles")])
      .then(([c, v]) => {
        setCustomersById(customersArrayToMap(c.data));
        setVehiclesById(vehiclesArrayToMap(v.data));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refetchRelated();
  }, [refetchRelated]);

  useAdminBackgroundPoll(refetchRelated, [refetchRelated]);

  const cellBooker = (key) => (i) => {
    const v = resolveBooker(i, customersById)[key];
    return (
      <span className={`break-all text-[11px] text-neutral-800 ${key === "name" ? "font-medium" : ""}`}>
        {v}
      </span>
    );
  };

  const cellVehicle = (booking) => {
    const vid = booking.vehicle_id;
    if (!vid) return <span className="text-neutral-400">—</span>;
    const label = bookedVehicleDisplayName(booking, vehiclesById);
    return (
      <button
        type="button"
        className="group inline-flex max-w-[220px] flex-col items-start gap-0.5 text-left"
        onClick={() =>
          setVehiclePreview({
            booking,
            vehicle: vehiclesById[vid] || null,
          })
        }
        data-testid={`bookings-vehicle-cell-${booking.id}`}
      >
        <span className="text-[11px] font-semibold text-[#E60000] underline-offset-2 group-hover:underline">
          {label}
        </span>
        <span className="font-mono text-[10px] text-neutral-500">{vid.slice(0, 8)}…</span>
      </button>
    );
  };

  return (
    <>
      <ResourcePage
        resource="bookings"
        title="Bookings"
        description="View, approve, and manage rental bookings — assign vehicles, drivers, and track status."
        actionLabel="New Booking"
        columns={[
          { key: "id", label: "Booking ID", render: (i) => <span className="font-mono">{i.id.slice(0, 8)}</span> },
          { key: "booker_name", label: "Name", render: cellBooker("name") },
          { key: "booker_email", label: "Email", render: cellBooker("email") },
          { key: "booker_phone", label: "Phone", render: cellBooker("phone") },
          { key: "vehicle_id", label: "Vehicle", render: cellVehicle },
          { key: "pickup_date", label: "Pickup", render: (i) => <span className="font-mono text-[11px]">{(i.pickup_date || "").slice(0, 10)}</span> },
          { key: "return_date", label: "Return", render: (i) => <span className="font-mono text-[11px]">{(i.return_date || "").slice(0, 10)}</span> },
          { key: "total_amount", label: "Amount", render: (i) => <span className="font-mono">{formatMoney(i.total_amount, currency)}</span> },
          { key: "status", label: "Status", isStatus: true },
          { key: "payment_status", label: "Payment", isStatus: true },
        ]}
      defaults={{
        customer_id: "", vehicle_id: "", driver_id: "", pickup_date: "", return_date: "",
        pickup_location: "", return_location: "", total_amount: 0, status: "pending", payment_status: "pending", notes: "",
      }}
      fields={[
        { key: "customer_id", label: "Customer ID", required: true },
        { key: "vehicle_id", label: "Vehicle ID", required: true },
        { key: "driver_id", label: "Driver ID (optional)" },
        { key: "pickup_date", label: "Pickup Date", required: true, type: "date" },
        { key: "return_date", label: "Return Date", required: true, type: "date" },
        { key: "pickup_location", label: "Pickup Location" },
        { key: "return_location", label: "Return Location" },
        { key: "total_amount", label: `Total Amount ${sfx}`, type: "number" },
        { key: "status", label: "Status", type: "select", options: ["pending", "confirmed", "ongoing", "completed", "cancelled"] },
        { key: "payment_status", label: "Payment Status", type: "select", options: ["pending", "paid", "refunded"] },
        { key: "notes", label: "Notes", type: "textarea", full: true },
      ]}
      />
      <VehicleBookedModal
        open={!!vehiclePreview}
        onClose={() => setVehiclePreview(null)}
        booking={vehiclePreview?.booking}
        vehicle={vehiclePreview?.vehicle}
        currency={currency}
      />
    </>
  );
}

function BookingsCalendar() {
  const { currency } = useBranding();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehiclePreview, setVehiclePreview] = useState(null);

  const loadCalendarData = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const [b, v, c] = await Promise.all([
        api.get("/bookings"),
        api.get("/vehicles"),
        api.get("/customers"),
      ]);
      setBookings(Array.isArray(b.data) ? b.data : []);
      setVehicles(Array.isArray(v.data) ? v.data : []);
      setCustomers(Array.isArray(c.data) ? c.data : []);
    } catch {
      /* keep calendar on transient errors; initial load still ends */
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  useAdminBackgroundPoll(() => {
    loadCalendarData({ silent: true });
  }, [loadCalendarData]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay(); // 0 = Sunday

  // Group bookings by day (YYYY-MM-DD)
  const byDay = {};
  bookings.forEach(b => {
    const day = (b.pickup_date || "").slice(0, 10);
    if (!day) return;
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(b);
  });

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateKey, bookings: byDay[dateKey] || [] });
  }

  const navigate = (delta) => {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + delta);
    setCursor(next);
  };

  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const vehiclesById = vehiclesArrayToMap(vehicles);
  const customersById = customersArrayToMap(customers);

  const openVehicleModal = (b) => {
    const vid = b.vehicle_id;
    setVehiclePreview({
      booking: b,
      vehicle: vid ? vehiclesById[vid] || null : null,
    });
  };

  const calendarVehicleLabel = (b) => bookedVehicleDisplayName(b, vehiclesById);

  const STATUS_COLOR = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    ongoing: "bg-violet-100 text-violet-800 border-violet-300",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };

  if (loading) return <div className="text-xs text-neutral-500 font-mono py-12 text-center">Loading calendar...</div>;

  const selectedDayBookings = selectedDay ? (byDay[selectedDay] || []) : [];

  return (
    <div data-testid="bookings-calendar">
      <PageHeader title="Booking Calendar" description="Visualize bookings by pickup date — click a day to see all bookings on that date." />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <button type="button" onClick={() => navigate(-1)} className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-neutral-300 p-2 hover:bg-neutral-50" data-testid="cal-prev"><CaretLeft size={14} /></button>
          <div className="min-w-0 px-2 text-center font-display text-lg font-bold tracking-tight sm:min-w-[180px] sm:text-left sm:text-2xl" data-testid="cal-month">{monthName}</div>
          <button type="button" onClick={() => navigate(1)} className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-neutral-300 p-2 hover:bg-neutral-50" data-testid="cal-next"><CaretRight size={14} /></button>
          <button type="button" onClick={() => setCursor(new Date())} className="min-h-[44px] border border-neutral-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-neutral-50 sm:ml-2" data-testid="cal-today">Today</button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]">
          {Object.entries(STATUS_COLOR).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5"><span className={`h-2 w-2 ${v.split(" ")[0]} border ${v.split(" ")[2]}`} />{k}</div>
          ))}
        </div>
      </div>

      <div className="sharp-card overflow-hidden">
        <div className="-mx-px overflow-x-auto sm:mx-0">
          <div className="min-w-[520px]">
        <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="border-r border-neutral-200 px-1 py-2 text-[9px] font-semibold uppercase tracking-wider text-neutral-600 last:border-r-0 sm:px-3 sm:text-[10px]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, idx) => (
            <div
              key={idx}
              role={c ? "button" : undefined}
              tabIndex={c ? 0 : undefined}
              onKeyDown={(e) => c && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelectedDay(c.dateKey))}
              onClick={() => c && setSelectedDay(c.dateKey)}
              className={`min-h-[72px] border-b border-r border-neutral-200 p-1 last-in-row:border-r-0 sm:min-h-[100px] sm:p-2 ${c ? "cursor-pointer hover:bg-neutral-50" : "bg-neutral-50/50"} ${selectedDay === c?.dateKey ? "bg-red-50 ring-1 ring-[#E60000]" : ""}`}
              data-testid={c ? `cal-day-${c.dateKey}` : undefined}
            >
              {c && (
                <>
                  <div className={`text-xs font-mono ${isToday(c.day) ? "bg-[#E60000] text-white w-6 h-6 flex items-center justify-center font-bold" : "text-neutral-700"}`}>
                    {c.day}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {c.bookings.slice(0, 3).map(b => (
                      <button
                        key={b.id}
                        type="button"
                        className={`block w-full truncate text-left text-[9px] px-1.5 py-0.5 border ${STATUS_COLOR[b.status] || ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openVehicleModal(b);
                        }}
                        data-testid={`cal-booking-chip-${b.id}`}
                      >
                        {calendarVehicleLabel(b).slice(0, 18)}
                      </button>
                    ))}
                    {c.bookings.length > 3 && (
                      <div className="text-[9px] text-neutral-500 px-1.5 font-mono">+{c.bookings.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="mt-6 sharp-card overflow-hidden" data-testid="selected-day-panel">
          <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">Bookings on</div>
              <div className="font-display font-mono text-lg font-bold tracking-tight sm:text-xl">{selectedDay}</div>
            </div>
            <button type="button" onClick={() => setSelectedDay(null)} className="min-h-[44px] self-start text-xs uppercase tracking-wider text-neutral-500 hover:text-neutral-900 sm:self-auto">Close</button>
          </div>
          {selectedDayBookings.length === 0 ? (
            <EmptyState message="No bookings on this date" testId="day-empty" />
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Booking</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Name</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Email</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Phone</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Vehicle</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Amount</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedDayBookings.map(b => (
                  <tr key={b.id} className="border-b border-neutral-100">
                    <td className="px-4 py-3 text-xs font-mono">{b.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs font-medium text-neutral-900">{resolveBooker(b, customersById).name}</td>
                    <td className="px-4 py-3 text-xs break-all text-neutral-700">{resolveBooker(b, customersById).email}</td>
                    <td className="px-4 py-3 text-xs break-all text-neutral-700">{resolveBooker(b, customersById).phone}</td>
                    <td className="px-4 py-3 text-xs">
                      {b.vehicle_id ? (
                        <button
                          type="button"
                          className="group text-left font-medium text-[#E60000] underline-offset-2 hover:underline"
                          onClick={() => openVehicleModal(b)}
                          data-testid={`cal-vehicle-cell-${b.id}`}
                        >
                          {calendarVehicleLabel(b)}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{formatMoney(b.total_amount, currency)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
      <VehicleBookedModal
        open={!!vehiclePreview}
        onClose={() => setVehiclePreview(null)}
        booking={vehiclePreview?.booking}
        vehicle={vehiclePreview?.vehicle}
        currency={currency}
      />
    </div>
  );
}
