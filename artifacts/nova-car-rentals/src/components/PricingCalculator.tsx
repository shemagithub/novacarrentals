import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Calculator, Calendar, MapPin, Car, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const vehiclePricing: Record<string, { label: string; pricePerDay: number; category: string }> = {
  economy: { label: "Economy Car", pricePerDay: 35, category: "Economy" },
  compact: { label: "Compact Car", pricePerDay: 45, category: "Economy" },
  rav4: { label: "Toyota RAV4", pricePerDay: 75, category: "SUV" },
  fortuner: { label: "Toyota Fortuner", pricePerDay: 95, category: "4x4 SUV" },
  prado: { label: "Toyota Prado", pricePerDay: 110, category: "4x4" },
  landcruiser: { label: "Land Cruiser V8", pricePerDay: 120, category: "Safari 4x4" },
  safari: { label: "Safari Vehicle (Popup)", pricePerDay: 130, category: "Safari" },
  sedan: { label: "Executive Sedan", pricePerDay: 70, category: "Executive" },
  luxury: { label: "Luxury / Mercedes", pricePerDay: 150, category: "Luxury" },
  van: { label: "Hiace Van (14-seat)", pricePerDay: 90, category: "Group" },
  coaster: { label: "Coaster Bus (30-seat)", pricePerDay: 130, category: "Group" },
};

const pickupLocations = [
  "Kigali, Rwanda",
  "Kigali Airport (KGL)",
  "Musanze, Rwanda",
  "Kampala, Uganda",
  "Entebbe Airport (EBB)",
  "Dar es Salaam, Tanzania",
  "Arusha, Tanzania",
  "Zanzibar, Tanzania",
];

function daysBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const d1 = new Date(from);
  const d2 = new Date(to);
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getDiscount(days: number): number {
  if (days >= 28) return 0.2;
  if (days >= 14) return 0.15;
  if (days >= 7) return 0.1;
  return 0;
}

export function PricingCalculator() {
  const today = new Date().toISOString().split("T")[0];
  const [vehicleKey, setVehicleKey] = useState("landcruiser");
  const [pickup, setPickup] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [withDriver, setWithDriver] = useState(false);

  const vehicle = vehiclePricing[vehicleKey];
  const days = daysBetween(fromDate, toDate);
  const discount = getDiscount(days);
  const baseTotal = vehicle.pricePerDay * days;
  const driverFee = withDriver ? 30 * days : 0;
  const discountAmount = Math.round(baseTotal * discount);
  const total = baseTotal - discountAmount + driverFee;
  const hasResult = days > 0;

  return (
    <div className="bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-8 py-6 flex items-center gap-3">
        <Calculator className="w-5 h-5 text-primary-foreground" />
        <div>
          <h3 className="font-display font-bold text-lg text-primary-foreground">Rental Cost Estimator</h3>
          <p className="text-primary-foreground/70 text-xs">Instant pricing — no obligation</p>
        </div>
      </div>

      <div className="p-8 space-y-5">
        {/* Vehicle Select */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2 flex items-center gap-1.5">
            <Car className="w-3 h-3" /> Vehicle Type
          </label>
          <div className="relative">
            <select
              value={vehicleKey}
              onChange={(e) => setVehicleKey(e.target.value)}
              data-testid="calc-vehicle"
              className="w-full bg-background border border-border text-foreground text-sm h-11 px-3 pr-9 appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              {Object.entries(vehiclePricing).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.label} — from ${v.pricePerDay}/day
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Pickup Location */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Pick-up Location
          </label>
          <div className="relative">
            <select
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              data-testid="calc-pickup"
              className="w-full bg-background border border-border text-foreground text-sm h-11 px-3 pr-9 appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="">Select location...</option>
              {pickupLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Pick-up Date
            </label>
            <input
              type="date"
              min={today}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              data-testid="calc-from"
              className="w-full bg-background border border-border text-foreground text-sm h-11 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Return Date
            </label>
            <input
              type="date"
              min={fromDate || today}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              data-testid="calc-to"
              className="w-full bg-background border border-border text-foreground text-sm h-11 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* With Driver Toggle */}
        <div className="flex items-center justify-between bg-background border border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Add Professional Driver</p>
            <p className="text-xs text-muted-foreground">+$30/day — multilingual, experienced</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={withDriver}
            onClick={() => setWithDriver(!withDriver)}
            data-testid="calc-driver-toggle"
            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
              withDriver ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                withDriver ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {hasResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-background border border-primary/30 p-5 space-y-3"
              data-testid="calc-result"
            >
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{vehicle.label}</span>
                <span>${vehicle.pricePerDay}/day × {days} day{days !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Vehicle subtotal</span>
                <span>${baseTotal}</span>
              </div>
              {withDriver && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Driver fee</span>
                  <span>+${driverFee}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-primary font-semibold">
                  <span>Long-stay discount ({Math.round(discount * 100)}%)</span>
                  <span>-${discountAmount}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="font-display font-bold text-base text-foreground">Estimated Total</span>
                <span className="text-3xl font-display font-bold text-primary">${total}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Estimate only. Final price confirmed at booking. Fuel, park fees, and cross-border permits billed separately.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-background border border-dashed border-border/60 p-5 text-center"
            >
              <Calculator className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Select dates to see your estimate</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Link href="/contact">
          <Button
            className="w-full h-12 font-display uppercase tracking-wider text-xs gap-2"
            data-testid="calc-book-button"
          >
            Book This Vehicle <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
