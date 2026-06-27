import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { DateRange } from "react-day-picker";
import {
  CheckCircle2, XCircle, ArrowRight, CalendarDays,
  Users, Fuel, ChevronRight, Info, MessageCircle,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  vehicles, bookings, isVehicleBooked, getBookedDates, categories,
} from "@/lib/availability";
import { useBooking } from "@/contexts/BookingContext";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function dayCount(from: Date, to: Date) {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export function AvailabilityCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [category, setCategory] = useState("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const { setSelection } = useBooking();

  const bookedDates = useMemo(() => getBookedDates(), []);

  // Vehicles filtered by category
  const filtered = useMemo(
    () => (category === "All" ? vehicles : vehicles.filter((v) => v.category === category)),
    [category]
  );

  // Availability result when a range is selected
  const results = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    const from = range.from;
    const to = range.to;
    return filtered.map((v) => ({
      vehicle: v,
      available: !isVehicleBooked(v.id, from, to),
      days: dayCount(from, to),
      total: v.pricePerDay * dayCount(from, to),
    }));
  }, [range, filtered]);

  const availableCount = results ? results.filter((r) => r.available).length : 0;
  const bookedCount = results ? results.filter((r) => !r.available).length : 0;

  // Dates to highlight as "busy" on the calendar
  const busyDates = useMemo(
    () => bookedDates.filter((d) => d >= today),
    [bookedDates]
  );

  return (
    <div className="bg-background" id="availability">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="text-primary font-bold text-xs uppercase tracking-widest">Live Availability</span>
        <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 mb-4">
          Check Vehicle Availability
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select your travel dates to instantly see which vehicles are available. Busy dates are highlighted on the calendar.
        </p>
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">

        {/* Left: Calendar + Legend */}
        <div className="space-y-5">
          {/* Calendar Card */}
          <div className="bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-sm font-display font-bold uppercase tracking-wider">Select Date Range</span>
            </div>
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              disabled={{ before: today }}
              modifiers={{ busy: busyDates }}
              modifiersClassNames={{
                busy: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary after:content-[''] relative",
              }}
              className="[--cell-size:2.1rem]"
            />

            {/* Legend */}
            <div className="border-t border-border mt-4 pt-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Busy dates
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block opacity-30" />
                Your selection
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-primary" />
                Booked
              </span>
            </div>
          </div>

          {/* Selection summary */}
          <AnimatePresence mode="wait">
            {range?.from && range?.to ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-primary/10 border border-primary/25 p-5"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Selected Period</p>
                <p className="font-display font-bold text-lg text-foreground">
                  {formatDate(range.from)} → {formatDate(range.to)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {dayCount(range.from, range.to)} day{dayCount(range.from, range.to) !== 1 ? "s" : ""}
                  {" "}· {availableCount} available · {bookedCount} booked
                </p>
                {range.from && range.to && (
                  <button
                    onClick={() => setRange(undefined)}
                    className="text-xs text-muted-foreground hover:text-primary mt-3 underline underline-offset-2 transition-colors"
                    data-testid="button-clear-range"
                  >
                    Clear selection
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-dashed border-border/60 p-5 text-center"
              >
                <Info className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Click a start date, then an end date to check availability
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Vehicle Availability Grid */}
        <div className="space-y-5">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2" data-testid="category-filter">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                data-testid={`filter-${cat.toLowerCase().replace(/\s/g, "-")}`}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  category === cat
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Vehicle List */}
          <AnimatePresence mode="wait">
            {results ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* Available first */}
                {[...results].sort((a, b) => Number(b.available) - Number(a.available)).map(({ vehicle: v, available, days, total }, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onMouseEnter={() => setHoveredId(v.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    data-testid={`availability-row-${v.id}`}
                    className={`bg-card border transition-all duration-200 overflow-hidden ${
                      available
                        ? hoveredId === v.id
                          ? "border-emerald-500/50"
                          : "border-border"
                        : "border-border opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Status indicator */}
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${available ? "bg-emerald-500" : "bg-primary"}`} />

                      {/* Vehicle info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="font-display font-bold text-sm text-foreground">{v.name}</p>
                              {v.tags.slice(0, 1).map((t) => (
                                <span key={t} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-muted text-muted-foreground">
                                  {t}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="text-primary font-semibold uppercase tracking-wider">{v.type}</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{v.seats}</span>
                              <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{v.fuel}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-display font-bold text-lg text-foreground">
                              ${total}
                              <span className="text-xs text-muted-foreground font-normal ml-1">total</span>
                            </p>
                            <p className="text-xs text-muted-foreground">${v.pricePerDay}/day × {days}d</p>
                          </div>
                        </div>
                      </div>

                      {/* Status + CTA */}
                      <div className="flex items-center gap-3 shrink-0">
                        {available ? (
                          <>
                            <span className="hidden sm:flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Available
                            </span>
                            {selectedVehicleId === v.id ? (
                              <button
                                onClick={() => {
                                  setSelectedVehicleId(null);
                                  setSelection(null);
                                }}
                                data-testid={`button-selected-${v.id}`}
                                className="h-8 px-3 text-xs font-display uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                              >
                                <MessageCircle className="w-3 h-3" /> Selected
                              </button>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs font-display uppercase tracking-wider"
                                data-testid={`button-book-${v.id}`}
                                onClick={() => {
                                  setSelectedVehicleId(v.id);
                                  setSelection({
                                    vehicleId: v.id,
                                    vehicleName: v.name,
                                    fromDate: range?.from?.toISOString().split("T")[0] ?? "",
                                    toDate: range?.to?.toISOString().split("T")[0] ?? "",
                                    pricePerDay: v.pricePerDay,
                                  });
                                }}
                              >
                                Book <ChevronRight className="w-3 h-3 ml-0.5" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <span className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5" /> Booked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand: show conflicting booking detail on hover */}
                    <AnimatePresence>
                      {!available && hoveredId === v.id && range?.from && range?.to && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-1 border-t border-border/50 bg-muted/30">
                            <p className="text-xs text-muted-foreground font-semibold mb-2">Conflicting bookings in your period:</p>
                            <div className="space-y-1">
                              {bookings
                                .filter(
                                  (b) =>
                                    b.vehicleId === v.id &&
                                    b.from <= range.to! &&
                                    b.to >= range.from!
                                )
                                .map((b, bi) => (
                                  <div key={bi} className="flex items-center gap-2 text-xs text-foreground">
                                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                                    <span className="text-muted-foreground">{formatDate(b.from)} → {formatDate(b.to)}</span>
                                    <span className="text-foreground/70">· {b.label}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* Skeleton state before date selection */}
                {filtered.map((v, i) => (
                  <div
                    key={v.id}
                    data-testid={`skeleton-row-${v.id}`}
                    className="bg-card border border-border p-4 flex items-center gap-4"
                  >
                    <div className="w-1 self-stretch bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-sm">{v.name}</span>
                        {v.tags.slice(0, 1).map((t) => (
                          <span key={t} className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-muted text-muted-foreground tracking-wider">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="text-primary font-semibold">{v.type}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{v.seats} seats</span>
                        <span>${v.pricePerDay}/day</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground italic">Select dates</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom CTA */}
          {results && availableCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-primary/10 border border-primary/25 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <p className="font-display font-bold text-base text-foreground">
                  {availableCount} vehicle{availableCount !== 1 ? "s" : ""} available for your dates
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inquiry confirmed within 2 hours. No payment until booking is finalised.
                </p>
              </div>
              <Link href="/contact">
                <Button className="gap-2 font-display uppercase tracking-wider text-xs shrink-0" data-testid="button-availability-cta">
                  Request Booking <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
