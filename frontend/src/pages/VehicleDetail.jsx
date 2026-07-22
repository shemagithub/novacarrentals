import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { fileImageSrcFromStored } from "@/lib/api";
import { useAdminBackgroundPoll } from "@/lib/adminPoll";
import { useBranding } from "@/contexts/BrandingContext";
import { formatMoney } from "@/lib/formatMoney";
import { useNavigate, useParams } from "react-router-dom";
import { StatusBadge, EmptyState } from "@/components/PageHeader";
import { useConfirm } from "@/components/ConfirmProvider";
import {
  ArrowLeft, UploadSimple, Trash, Plus, ImageSquare,
  CarProfile, Calendar, Gauge, Wrench, Camera, X
} from "@phosphor-icons/react";
import { toast } from "sonner";

const BOOL_LABELS = {
  gps_enabled: "GPS navigation",
  air_conditioning: "Air conditioning",
  bluetooth_usb: "Bluetooth / USB",
  android_auto_carplay: "Android Auto / Apple CarPlay",
  backup_camera: "Backup camera",
  parking_sensors: "Parking sensors",
  cruise_control: "Cruise control",
  heated_seats: "Heated seats",
  leather_seats: "Leather seats",
  sunroof: "Sunroof",
  child_seat_support: "Child seat support",
  wifi_available: "Wi-Fi",
  tracking_system: "Tracking system",
  abs_brakes: "ABS brakes",
  airbags: "Airbags",
  stability_control: "Stability control",
  lane_assist: "Lane assist",
  emergency_braking: "Emergency braking",
  tire_pressure_monitoring: "Tire pressure monitoring",
  security_alarm: "Security alarm",
};

/** Ordered image slots + gallery; dedupes identical paths. */
function collectVehicleImageEntries(vehicle) {
  const entries = [];
  const seen = new Set();
  const push = (label, field) => {
    const raw = vehicle[field];
    if (raw == null || String(raw).trim() === "") return;
    const t = String(raw).trim();
    if (seen.has(t)) return;
    seen.add(t);
    entries.push({ raw: t, field, label });
  };
  push("Hero", "image_url");
  push("Front", "image_front");
  push("Back", "image_back");
  push("Side", "image_side");
  push("Interior", "image_interior");
  for (const g of vehicle.gallery_images || []) {
    if (g == null || String(g).trim() === "") continue;
    const t = String(g).trim();
    if (seen.has(t)) continue;
    seen.add(t);
    entries.push({ raw: t, field: "gallery_images", label: "Gallery" });
  }
  return entries;
}

function isImageExternallyHosted(raw) {
  if (!raw || typeof raw !== "string") return false;
  const s = raw.trim();
  if (!/^https?:\/\//i.test(s)) return false;
  return !s.includes("/api/files/");
}

export default function VehicleDetail() {
  const { currency } = useBranding();
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInspectionForm, setShowInspectionForm] = useState(false);

  const fetchAll = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const [v, ins] = await Promise.all([
        api.get(`/vehicles/${id}`),
        api.get(`/vehicle_inspections`),
      ]);
      setVehicle(v.data);
      setInspections(ins.data.filter((i) => i.vehicle_id === id));
    } catch (e) {
      if (!silent) toast.error("Failed to load vehicle");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useAdminBackgroundPoll(() => {
    fetchAll({ silent: true });
  }, [fetchAll]);

  if (loading) {
    return <div className="text-xs text-neutral-500 font-mono py-12 text-center" data-testid="vehicle-detail-loading">Loading vehicle...</div>;
  }
  if (!vehicle) {
    return <div className="text-xs text-neutral-500 font-mono py-12 text-center">Vehicle not found</div>;
  }

  return (
    <div data-testid="vehicle-detail-page">
      <button
        onClick={() => navigate("/vehicles")}
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-500 hover:text-[#E60000] mb-3"
        data-testid="back-to-vehicles"
      >
        <ArrowLeft size={12} weight="bold" /> Back to Vehicles
      </button>

      <div className="flex items-end justify-between mb-6 pb-4 border-b border-neutral-200">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-1">
            {vehicle.brand} · {vehicle.year}
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tighter leading-none flex items-center gap-3">
            {vehicle.name}
            <StatusBadge status={vehicle.status} />
          </h2>
          <p className="text-xs text-neutral-500 mt-2 font-mono">{vehicle.registration_number}</p>
          {vehicle.description?.trim() ? (
            <p className="text-sm text-neutral-600 mt-3 max-w-3xl leading-relaxed whitespace-pre-line">
              {vehicle.description.trim()}
            </p>
          ) : null}
        </div>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <SpecCard icon={CarProfile} label="Category" value={vehicle.category} />
        <SpecCard icon={Gauge} label="Mileage" value={`${vehicle.mileage} km`} />
        <SpecCard icon={Wrench} label="Condition" value={vehicle.condition} />
        <SpecCard label="Fuel" value={vehicle.fuel_type} />
        <SpecCard label="Transmission" value={vehicle.transmission} />
        <SpecCard label="Daily Rate" value={formatMoney(vehicle.daily_rate, currency)} accent />
      </div>

      <VehicleInfoSections vehicle={vehicle} currency={currency} />

      {/* Image Gallery */}
      <Gallery vehicle={vehicle} onChange={fetchAll} />

      {/* Inspections */}
      <div className="mt-8">
        <div className="flex items-end justify-between mb-4 pb-3 border-b border-neutral-200">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">Inspection History</div>
            <h3 className="font-display font-bold text-2xl tracking-tight">Reports & Logs</h3>
          </div>
          <button
            onClick={() => setShowInspectionForm(true)}
            className="bg-[#E60000] hover:bg-[#CC0000] text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-sm"
            data-testid="add-inspection-button"
          >
            <Plus size={14} weight="bold" /> New Inspection
          </button>
        </div>

        {inspections.length === 0 ? (
          <EmptyState message="No inspection reports yet" testId="inspections-empty" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inspections.map(ins => (
              <InspectionCard key={ins.id} inspection={ins} onDelete={fetchAll} />
            ))}
          </div>
        )}
      </div>

      {showInspectionForm && (
        <InspectionForm
          vehicleId={id}
          onClose={() => setShowInspectionForm(false)}
          onSaved={() => { setShowInspectionForm(false); fetchAll(); }}
        />
      )}
    </div>
  );
}

function SpecCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="sharp-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">{label}</div>
        {Icon && <Icon size={14} className="text-neutral-400" />}
      </div>
      <div className={`mt-2 font-mono font-bold tracking-tight text-lg ${accent ? "text-[#E60000]" : "text-neutral-900"}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function fmtMoneyMaybe(v, currency) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return formatMoney(n, currency);
}

function DetailBlock({ title, children }) {
  return (
    <div className="sharp-card p-5 mb-6">
      <h3 className="font-display border-b border-neutral-200 pb-2 mb-4 text-lg font-bold tracking-tight">
        {title}
      </h3>
      <dl className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-x-8">{children}</dl>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="border-b border-neutral-100 py-2.5 md:odd:border-r md:odd:pr-6">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="mt-0.5 break-words font-mono text-sm text-neutral-900">{value}</dd>
    </div>
  );
}

function TagList({ title, items }) {
  if (!items || !items.length) return null;
  return (
    <div className="sharp-card p-5 mb-6">
      <h3 className="font-display border-b border-neutral-200 pb-2 mb-3 text-lg font-bold tracking-tight">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((t, i) => (
          <span
            key={`${i}-${t}`}
            className="border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-800"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

const POLICY_DETAIL_KEYS = [
  "fuel_policy",
  "cancellation_policy",
  "smoking_policy",
  "pets_policy",
  "cross_border_policy",
  "min_driver_age",
  "license_requirements",
  "international_license_policy",
  "id_requirements",
];

function VehicleInfoSections({ vehicle, currency }) {
  const equipmentOn = useMemo(
    () =>
      Object.entries(BOOL_LABELS)
        .filter(([key]) => vehicle[key])
        .map(([, label]) => label),
    [vehicle],
  );

  const hasPolicyContent = POLICY_DETAIL_KEYS.some((k) => {
    const v = vehicle[k];
    return v !== null && v !== undefined && String(v).trim() !== "";
  });

  return (
    <div className="mb-8" data-testid="vehicle-info-sections">
      <div className="mb-4 border-b border-neutral-200 pb-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Full record
        </div>
        <h3 className="font-display text-2xl font-bold tracking-tight">Vehicle details</h3>
      </div>

      <DetailBlock title="Identification">
        <DetailRow label="Display name" value={vehicle.name} />
        <DetailRow label="Brand" value={vehicle.brand} />
        <DetailRow label="Model" value={vehicle.model_name} />
        <DetailRow label="Public description" value={vehicle.description} />
        <DetailRow label="Category" value={vehicle.category} />
        <DetailRow label="Year" value={vehicle.year} />
        <DetailRow label="Registration" value={vehicle.registration_number} />
        <DetailRow label="Status" value={vehicle.status} />
        <DetailRow label="Verified" value={vehicle.verified_vehicle ? "Yes" : "No"} />
      </DetailBlock>

      <DetailBlock title="Rates & billing (daily)">
        <DetailRow label="Daily rate" value={fmtMoneyMaybe(vehicle.daily_rate, currency)} />
        <DetailRow
          label="Discount"
          value={
            vehicle.discount_rate != null && vehicle.discount_rate !== ""
              ? `${vehicle.discount_rate}%`
              : null
          }
        />
        <DetailRow label="Extra charges" value={fmtMoneyMaybe(vehicle.extra_charges, currency)} />
        <DetailRow label="Late return fee" value={fmtMoneyMaybe(vehicle.late_return_fee, currency)} />
        <DetailRow label="Airport pickup fee" value={fmtMoneyMaybe(vehicle.airport_pickup_fee, currency)} />
      </DetailBlock>

      <DetailBlock title="Specifications">
        <DetailRow label="Seats" value={vehicle.seats} />
        <DetailRow label="Doors" value={vehicle.doors} />
        <DetailRow label="Luggage capacity" value={vehicle.luggage_capacity} />
        <DetailRow label="Mileage" value={vehicle.mileage != null ? `${vehicle.mileage} km` : null} />
        <DetailRow label="Mileage limit / day" value={vehicle.mileage_limit_per_day != null ? `${vehicle.mileage_limit_per_day} km` : null} />
        <DetailRow label="Condition" value={vehicle.condition} />
        <DetailRow label="Fuel type" value={vehicle.fuel_type} />
        <DetailRow label="Transmission" value={vehicle.transmission} />
        <DetailRow label="Engine" value={vehicle.engine_size} />
        <DetailRow label="Horsepower" value={vehicle.horsepower != null ? `${vehicle.horsepower} hp` : null} />
        <DetailRow label="Fuel consumption" value={vehicle.fuel_consumption} />
      </DetailBlock>

      <TagList title="Features" items={vehicle.features} />
      <TagList title="Comfort" items={vehicle.comfort_features} />
      <TagList title="Safety" items={vehicle.safety_features} />

      {equipmentOn.length > 0 && (
        <div className="sharp-card p-5 mb-6">
          <h3 className="font-display border-b border-neutral-200 pb-2 mb-3 text-lg font-bold tracking-tight">
            Equipment
          </h3>
          <ul className="grid grid-cols-1 gap-1.5 text-sm text-neutral-800 sm:grid-cols-2">
            {equipmentOn.map((label) => (
              <li key={label} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E60000]" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasPolicyContent && (
        <DetailBlock title="Policies & requirements">
          <DetailRow label="Fuel policy" value={vehicle.fuel_policy} />
          <DetailRow label="Cancellation" value={vehicle.cancellation_policy} />
          <DetailRow label="Smoking" value={vehicle.smoking_policy} />
          <DetailRow label="Pets" value={vehicle.pets_policy} />
          <DetailRow label="Cross-border" value={vehicle.cross_border_policy} />
          <DetailRow label="Min. driver age" value={vehicle.min_driver_age} />
          <DetailRow label="License requirements" value={vehicle.license_requirements} />
          <DetailRow label="International license" value={vehicle.international_license_policy} />
          <DetailRow label="ID requirements" value={vehicle.id_requirements} />
        </DetailBlock>
      )}

      {Array.isArray(vehicle.payment_methods) && vehicle.payment_methods.length > 0 && (
        <DetailBlock title="Payment">
          <DetailRow
            label="Accepted methods"
            value={vehicle.payment_methods.join(", ")}
          />
        </DetailBlock>
      )}
    </div>
  );
}

function Gallery({ vehicle, onChange }) {
  const confirm = useConfirm();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const imageEntries = useMemo(() => collectVehicleImageEntries(vehicle), [vehicle]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post(`/uploads?folder=vehicles/${vehicle.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploaded.push(data.path);
      }
      const newGallery = [...(vehicle.gallery_images || []), ...uploaded];
      const updatePayload = { ...vehicle, gallery_images: newGallery };
      delete updatePayload.id;
      delete updatePayload.created_at;
      delete updatePayload.updated_at;
      await api.put(`/vehicles/${vehicle.id}`, updatePayload);
      toast.success(`${files.length} image(s) uploaded`);
      onChange();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = async (entry) => {
    const ok = await confirm({
      title: "Remove this image?",
      message: "The image will be detached from this vehicle.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    try {
      const updatePayload = { ...vehicle };
      delete updatePayload.id;
      delete updatePayload.created_at;
      delete updatePayload.updated_at;

      if (entry.field === "gallery_images") {
        updatePayload.gallery_images = (vehicle.gallery_images || []).filter((p) => p !== entry.raw);
      } else {
        updatePayload[entry.field] = null;
      }

      await api.put(`/vehicles/${vehicle.id}`, updatePayload);
      toast.success("Image removed");
      onChange();
    } catch {
      toast.error("Failed to remove image");
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-4 pb-3 border-b border-neutral-200">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">Visual</div>
          <h3 className="font-display font-bold text-2xl tracking-tight flex items-center gap-2">
            <ImageSquare size={20} className="text-[#E60000]" /> Image Gallery
          </h3>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            data-testid="gallery-file-input"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-sm"
            data-testid="upload-images-button"
          >
            <UploadSimple size={14} weight="bold" />
            {uploading ? "Uploading..." : "Upload Images"}
          </button>
        </div>
      </div>

      {imageEntries.length === 0 ? (
        <div className="sharp-card p-12 text-center">
          <Camera size={32} className="text-neutral-300 mx-auto mb-3" />
          <div className="text-xs text-neutral-500 uppercase tracking-wider font-mono">No images yet — upload to start the gallery</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3" data-testid="gallery-grid">
          {imageEntries.map((entry, idx) => {
            const src = fileImageSrcFromStored(entry.raw);
            const deletable = !isImageExternallyHosted(entry.raw);
            return (
              <div
                key={`${idx}-${entry.raw}`}
                className="group relative aspect-square sharp-card cursor-pointer overflow-hidden"
                data-testid={`gallery-image-${idx}`}
              >
                {src ? (
                  <img
                    src={src}
                    alt={entry.label}
                    className="h-full w-full object-cover"
                    onClick={() => setLightbox(src)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-neutral-100 text-[10px] text-neutral-500">
                    Invalid path
                  </div>
                )}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/55 px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wider text-white">
                  {entry.label}
                </div>
                {deletable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(entry);
                    }}
                    className="absolute right-2 top-2 bg-white/90 p-1.5 opacity-0 transition-opacity hover:bg-[#E60000] hover:text-white group-hover:opacity-100"
                    data-testid={`gallery-remove-${idx}`}
                  >
                    <Trash size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setLightbox(null)}
          data-testid="lightbox"
        >
          <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10"><X size={20} /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

function InspectionCard({ inspection, onDelete }) {
  const confirm = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete inspection report?",
      message: "This inspection record will be permanently removed.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/vehicle_inspections/${inspection.id}`);
      toast.success("Inspection deleted");
      onDelete();
    } catch {
      toast.error("Delete failed");
    }
  };

  const conditionColor = {
    Excellent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    Good: "text-blue-700 bg-blue-50 border-blue-200",
    Fair: "text-amber-700 bg-amber-50 border-amber-200",
    Poor: "text-red-700 bg-red-50 border-red-200",
  }[inspection.overall_condition] || "text-neutral-700 bg-neutral-50 border-neutral-200";

  return (
    <div className="sharp-card p-5" data-testid={`inspection-${inspection.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold flex items-center gap-1.5">
            <Calendar size={11} /> {(inspection.inspection_date || "").slice(0, 10)}
          </div>
          <div className="font-display font-bold text-lg tracking-tight mt-1">{inspection.inspector}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 border ${conditionColor}`}>
            {inspection.overall_condition}
          </span>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 group"
            data-testid={`inspection-delete-${inspection.id}`}
          >
            <Trash size={12} className="text-neutral-700 group-hover:text-[#E60000]" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Mileage</div>
          <div className="font-mono">{inspection.mileage} km</div>
        </div>
        {inspection.next_inspection_date && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Next Due</div>
            <div className="font-mono">{(inspection.next_inspection_date || "").slice(0, 10)}</div>
          </div>
        )}
      </div>
      {inspection.notes && (
        <div className="text-xs text-neutral-700 mb-3 bg-neutral-50 p-2 border border-neutral-200">
          {inspection.notes}
        </div>
      )}
      {inspection.issues_found && inspection.issues_found.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Issues Found</div>
          <div className="flex flex-wrap gap-1">
            {inspection.issues_found.map((iss, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider font-semibold">{iss}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InspectionForm({ vehicleId, onClose, onSaved }) {
  const [form, setForm] = useState({
    vehicle_id: vehicleId,
    inspector: "",
    inspection_date: new Date().toISOString().slice(0, 10),
    overall_condition: "Good",
    mileage: 0,
    notes: "",
    issues_found: [],
    photo_paths: [],
    next_inspection_date: "",
  });
  const [issueInput, setIssueInput] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/vehicle_inspections", { ...form, mileage: Number(form.mileage) });
      toast.success("Inspection added");
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addIssue = () => {
    if (issueInput.trim()) {
      setForm({ ...form, issues_found: [...form.issues_found, issueInput.trim()] });
      setIssueInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" data-testid="inspection-form-modal">
      <div className="bg-white border border-neutral-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-sm">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">New Report</div>
            <div className="font-display font-bold text-xl tracking-tight">Vehicle Inspection</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 text-xs uppercase tracking-wider">Close</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4" data-testid="inspection-form">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inspector Name" value={form.inspector} onChange={(v) => setForm({ ...form, inspector: v })} required testId="inspection-inspector" />
            <Field label="Inspection Date" type="date" value={form.inspection_date} onChange={(v) => setForm({ ...form, inspection_date: v })} required testId="inspection-date" />
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">Overall Condition *</label>
              <select
                value={form.overall_condition}
                onChange={(e) => setForm({ ...form, overall_condition: e.target.value })}
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
                data-testid="inspection-condition"
              >
                {["Excellent", "Good", "Fair", "Poor"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Field label="Mileage (km)" type="number" value={form.mileage} onChange={(v) => setForm({ ...form, mileage: v })} testId="inspection-mileage" />
            <Field label="Next Inspection Date" type="date" value={form.next_inspection_date} onChange={(v) => setForm({ ...form, next_inspection_date: v })} testId="inspection-next" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
              data-testid="inspection-notes"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">Issues Found</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={issueInput}
                onChange={(e) => setIssueInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addIssue(); } }}
                placeholder="e.g. Front-left tire worn"
                className="flex-1 bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
                data-testid="inspection-issue-input"
              />
              <button type="button" onClick={addIssue} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border border-neutral-300 hover:bg-neutral-50 rounded-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.issues_found.map((iss, i) => (
                <span key={i} className="text-[10px] px-2 py-1 bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider font-semibold flex items-center gap-1">
                  {iss}
                  <button type="button" onClick={() => setForm({ ...form, issues_found: form.issues_found.filter((_, j) => j !== i) })}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-neutral-300 hover:bg-neutral-50 rounded-sm">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#E60000] hover:bg-[#CC0000] text-white text-xs font-semibold uppercase tracking-wider rounded-sm disabled:opacity-50"
              data-testid="inspection-submit"
            >
              {saving ? "Saving..." : "Save Inspection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, testId }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-1.5">{label}{required && " *"}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-white border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-[#E60000] rounded-sm"
        data-testid={testId}
      />
    </div>
  );
}
