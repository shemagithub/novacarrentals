import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ResourcePage from "@/components/ResourcePage";
import { useBranding } from "@/contexts/BrandingContext";
import { useVehicleCategories } from "@/lib/useVehicleCategories";
import { formatMoney, currencyFieldSuffix } from "@/lib/formatMoney";
import { ArrowSquareOut } from "@phosphor-icons/react";

const VEHICLE_POLICY_DEFAULTS = {
  cancellation_policy: "Free cancellation up to 24 hours before pickup",
  smoking_policy: "Smoking is strictly prohibited inside the vehicle",
  pets_policy: "Pets allowed only with prior approval",
  cross_border_policy: "Allowed for Rwanda, Uganda, and Tanzania with prior notice",
  min_driver_age: 18,
  license_requirements: "Valid national driving license required",
  id_requirements: "Valid ID or passport required at pickup",
  international_license_policy: "International Driving Permit accepted",
  payment_methods: "Cash, Mobile Money, Bank Transfer, Card",
};

const VEHICLE_DEFAULTS = {
  name: "",
  brand: "",
  model_name: "",
  description: "",
  category: "Sedan",
  registration_number: "",
  year: 2024,
  fuel_type: "Petrol",
  transmission: "Automatic",
  seats: 5,
  daily_rate: 50,
  status: "available",
  mileage: 0,
  condition: "Excellent",
  gps_enabled: false,
  fuel_policy: "",
  air_conditioning: true,
  bluetooth_usb: false,
  android_auto_carplay: false,
  backup_camera: false,
  parking_sensors: false,
  cruise_control: false,
  heated_seats: false,
  leather_seats: false,
  sunroof: false,
  child_seat_support: false,
  wifi_available: false,
  tracking_system: false,
  abs_brakes: true,
  airbags: true,
  stability_control: false,
  lane_assist: false,
  emergency_braking: false,
  tire_pressure_monitoring: false,
  security_alarm: false,
  engine_size: "",
  horsepower: null,
  fuel_consumption: "",
  doors: null,
  luggage_capacity: "",
  ...VEHICLE_POLICY_DEFAULTS,
  verified_vehicle: false,
  image_url: "",
  image_front: "",
  image_back: "",
  image_side: "",
  image_interior: "",
  gallery_images: [],
};

function buildVehicleFields(categories, sfx) {
  const categoryOptions = categories.length ? categories : ["Sedan"];
  return [
    { key: "verified_vehicle", label: "Verified vehicle badge", type: "checkbox", checkboxLabel: "Show verified badge on website" },
    { key: "name", label: "Vehicle Name", required: true },
    { key: "registration_number", label: "Registration No.", required: true },
    { key: "brand", label: "Brand", required: true },
    { key: "model_name", label: "Model" },
    {
      key: "description",
      label: "Description (public vehicle page)",
      type: "textarea",
      full: true,
      rows: 5,
    },
    { key: "category", label: "Category", type: "select", options: categoryOptions },
    { key: "year", label: "Year", type: "number" },
    { key: "fuel_type", label: "Fuel Type", type: "select", options: ["Petrol", "Diesel", "Electric", "Hybrid"] },
    { key: "transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual"] },
    { key: "seats", label: "Seats", type: "number" },
    { key: "daily_rate", label: `Daily Rate ${sfx}`, type: "number" },
    { key: "fuel_policy", label: "Fuel Policy", full: true },
    { key: "mileage", label: "Mileage (km)", type: "number" },
    { key: "status", label: "Status", type: "select", options: ["available", "reserved", "rented", "maintenance", "out_of_service"] },
    { key: "condition", label: "Condition", type: "select", options: ["Excellent", "Good", "Fair", "Poor"] },
    { key: "image_url", label: "Main image (hero)", type: "imageUpload", uploadFolder: "vehicles", full: true },
    { key: "image_front", label: "Car image (front)", type: "imageUpload", uploadFolder: "vehicles", full: true },
    { key: "image_back", label: "Car image (back)", type: "imageUpload", uploadFolder: "vehicles", full: true },
    { key: "image_side", label: "Car image (side)", type: "imageUpload", uploadFolder: "vehicles", full: true },
    { key: "image_interior", label: "Car image (interior)", type: "imageUpload", uploadFolder: "vehicles", full: true },
    { key: "engine_size", label: "Engine size" },
    { key: "horsepower", label: "Horsepower", type: "number" },
    { key: "fuel_consumption", label: "Fuel consumption" },
    { key: "doors", label: "Number of doors", type: "number" },
    { key: "luggage_capacity", label: "Luggage capacity" },
    { key: "gps_enabled", label: "GPS Enabled", type: "checkbox", checkboxLabel: "Vehicle has GPS tracker" },
    { key: "air_conditioning", label: "Air conditioning", type: "checkbox", checkboxLabel: "A/C available" },
    { key: "bluetooth_usb", label: "Bluetooth/USB", type: "checkbox", checkboxLabel: "Bluetooth/USB support" },
    { key: "android_auto_carplay", label: "Android Auto / CarPlay", type: "checkbox", checkboxLabel: "Supports Android Auto / Apple CarPlay" },
    { key: "backup_camera", label: "Backup camera", type: "checkbox", checkboxLabel: "Has backup camera" },
    { key: "parking_sensors", label: "Parking sensors", type: "checkbox", checkboxLabel: "Has parking sensors" },
    { key: "cruise_control", label: "Cruise control", type: "checkbox", checkboxLabel: "Has cruise control" },
    { key: "heated_seats", label: "Heated seats", type: "checkbox", checkboxLabel: "Has heated seats" },
    { key: "leather_seats", label: "Leather seats", type: "checkbox", checkboxLabel: "Has leather seats" },
    { key: "sunroof", label: "Sunroof", type: "checkbox", checkboxLabel: "Has sunroof" },
    { key: "child_seat_support", label: "Child seat support", type: "checkbox", checkboxLabel: "Supports child seat" },
    { key: "wifi_available", label: "Wi‑Fi", type: "checkbox", checkboxLabel: "Wi‑Fi available" },
    { key: "tracking_system", label: "Tracking system", type: "checkbox", checkboxLabel: "Tracking system enabled" },
    { key: "airbags", label: "Airbags", type: "checkbox", checkboxLabel: "Airbags" },
    { key: "abs_brakes", label: "ABS brakes", type: "checkbox", checkboxLabel: "ABS brakes" },
    { key: "stability_control", label: "Stability control", type: "checkbox", checkboxLabel: "Stability control" },
    { key: "lane_assist", label: "Lane assist", type: "checkbox", checkboxLabel: "Lane assist" },
    { key: "emergency_braking", label: "Emergency braking", type: "checkbox", checkboxLabel: "Emergency braking" },
    { key: "tire_pressure_monitoring", label: "Tire pressure monitoring", type: "checkbox", checkboxLabel: "TPMS" },
    { key: "security_alarm", label: "Security alarm", type: "checkbox", checkboxLabel: "Security alarm" },
    { key: "cancellation_policy", label: "Cancellation policy", type: "textarea", full: true, rows: 3 },
    { key: "smoking_policy", label: "Smoking policy", type: "textarea", full: true, rows: 2 },
    { key: "pets_policy", label: "Pets policy", type: "textarea", full: true, rows: 2 },
    { key: "cross_border_policy", label: "Cross-border travel policy", type: "textarea", full: true, rows: 2 },
    { key: "min_driver_age", label: "Minimum driver age", type: "number" },
    { key: "license_requirements", label: "Driving license requirements", type: "textarea", full: true, rows: 2 },
    { key: "id_requirements", label: "Passport/ID requirements", type: "textarea", full: true, rows: 2 },
    { key: "international_license_policy", label: "International license policy", type: "textarea", full: true, rows: 2 },
    { key: "payment_methods", label: "Payment methods accepted (comma-separated)", type: "tags", full: true },
  ];
}

export default function Vehicles() {
  const navigate = useNavigate();
  const { currency } = useBranding();
  const { categories } = useVehicleCategories();
  const sfx = currencyFieldSuffix(currency);

  const fields = useMemo(() => buildVehicleFields(categories, sfx), [categories, sfx]);
  const defaults = useMemo(
    () => ({
      ...VEHICLE_DEFAULTS,
      category: categories[0] || VEHICLE_DEFAULTS.category,
    }),
    [categories],
  );

  return (
    <ResourcePage
      resource="vehicles"
      title="Vehicles"
      description="Manage your entire fleet — click a row for full detail, gallery and inspections. Categories are managed under Vehicle categories."
      actionLabel="Add Vehicle"
      columns={[
        {
          key: "name",
          label: "Vehicle",
          render: (i) => (
            <button
              onClick={() => navigate(`/vehicles/${i.id}`)}
              className="flex items-center gap-1.5 hover:text-[#E60000] font-medium text-left"
              data-testid={`vehicle-open-${i.id}`}
            >
              {i.name} <ArrowSquareOut size={11} className="opacity-50" />
            </button>
          ),
        },
        { key: "registration_number", label: "Reg. No.", mono: true },
        { key: "category", label: "Category" },
        { key: "fuel_type", label: "Fuel" },
        { key: "transmission", label: "Trans." },
        {
          key: "daily_rate",
          label: "Rate / Day",
          render: (v) => <span className="font-mono">{formatMoney(v.daily_rate, currency)}</span>,
        },
        { key: "status", label: "Status", isStatus: true },
      ]}
      defaults={defaults}
      fallbackEmptyFromDefaults
      fields={fields}
    />
  );
}
