import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Users, Briefcase, Fuel, Info, CarFront, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FLEET_QUERY_KEY,
  FLEET_SORT_OPTIONS,
  VEHICLE_CATEGORIES_QUERY_KEY,
  fetchPublicVehicleCategories,
  fetchPublicVehicles,
  mapVehicleToDisplay,
  sortFleetVehicles,
  type FleetSortKey,
  type VehicleDisplay,
} from "@/lib/fleet-api";
import { useCmsPageSeo } from "@/hooks/useCmsPageSeo";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { cleanDisplayText } from "@/lib/display-text";

function VehicleCard({
  car,
  index,
  formatRatePerDay,
}: {
  car: VehicleDisplay;
  index: number;
  formatRatePerDay: (amount: number) => string;
}) {
  const isAvailable = car.status.toLowerCase() === "available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 8) * 0.05 }}
      data-testid={`card-vehicle-${car.id}`}
      className="group bg-card border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {car.imageUrl ? (
          <img
            src={car.imageUrl}
            alt={car.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <CarFront className="w-14 h-14 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur px-3 py-1 text-sm font-bold">
          From {formatRatePerDay(car.pricePerDay)}
        </div>
        {(car.badge || car.tags[0]) && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${
                isAvailable
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/90 text-foreground border border-border"
              }`}
            >
              {car.badge || car.tags[0]}
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{car.category}</p>
        <h3 className="text-base font-display font-bold mb-1 group-hover:text-primary transition-colors">
          {car.name}
        </h3>
        <p className="text-[11px] text-muted-foreground mb-1">{car.type}</p>
        {car.branchDisplay && (
          <p className="text-[11px] text-muted-foreground mb-3">{car.branchDisplay}</p>
        )}
        <div className="flex gap-4 text-xs text-muted-foreground mb-5 mt-auto">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {car.seats} seats
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> {car.bags} bags
          </span>
          {car.fuel ? (
            <span className="flex items-center gap-1">
              <Fuel className="w-3 h-3" /> {car.fuel}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link href={`/fleet/${car.id}`} className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full font-display uppercase tracking-wider text-xs h-10"
              data-testid={`button-details-${car.id}`}
            >
              <Info className="w-3 h-3 mr-1.5" /> Details
            </Button>
          </Link>
          <Link href="/contact" className="flex-1">
            <Button
              size="sm"
              className="w-full font-display uppercase tracking-wider text-xs h-10 group/btn"
              data-testid={`button-reserve-${car.id}`}
            >
              Book <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function FleetControls({
  categories,
  categoryFilter,
  onCategoryFilter,
  sort,
  onSort,
  resultCount,
}: {
  categories: string[];
  categoryFilter: string;
  onCategoryFilter: (cat: string) => void;
  sort: FleetSortKey;
  onSort: (sort: FleetSortKey) => void;
  resultCount: number;
}) {
  return (
    <div className="sticky top-20 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-10 bg-background/95 backdrop-blur border-y border-border">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryFilter(cat)}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">
            {resultCount} vehicle{resultCount === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            <Select value={sort} onValueChange={(v) => onSort(v as FleetSortKey)}>
              <SelectTrigger
                className="w-[200px] h-9 text-xs font-semibold uppercase tracking-wider border-border bg-card"
                aria-label="Sort vehicles"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {FLEET_SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Fleet() {
  useCmsPageSeo("fleet", {
    title: "Our Fleet",
    description: "Browse safari 4x4s, executive sedans, and group vans for rent across East Africa.",
  });

  const { currency, formatRatePerDay } = useFormatMoney();

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState<FleetSortKey>("name-asc");

  const { data: raw = [], isLoading, isError } = useQuery({
    queryKey: FLEET_QUERY_KEY,
    queryFn: () => fetchPublicVehicles(100),
  });

  const { data: categoryRows = [] } = useQuery({
    queryKey: VEHICLE_CATEGORIES_QUERY_KEY,
    queryFn: () => fetchPublicVehicleCategories(100),
    staleTime: 60_000,
  });

  const vehicles = useMemo(() => raw.map((v) => mapVehicleToDisplay(v, currency)), [raw, currency]);

  const categoryOptions = useMemo(() => {
    const fromApi = categoryRows.map((c) => cleanDisplayText(c.name)).filter(Boolean);
    const fromFleet = [...new Set(vehicles.map((v) => v.category).filter(Boolean))];
    const ordered = fromApi.length
      ? [...fromApi, ...fromFleet.filter((c) => !fromApi.includes(c))]
      : fromFleet.sort((a, b) => a.localeCompare(b));
    return ["All", ...ordered];
  }, [categoryRows, vehicles]);

  const filtered = useMemo(() => {
    if (categoryFilter === "All") return vehicles;
    return vehicles.filter((v) => v.category === categoryFilter);
  }, [vehicles, categoryFilter]);

  const displayed = useMemo(
    () => sortFleetVehicles(filtered, sort),
    [filtered, sort],
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="py-24 bg-card border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Our Fleet</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6">
              The Right Vehicle
              <br />
              for Every Journey.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Live inventory from our admin system: safari 4x4s, executive sedans, and group transport.
              Every vehicle is professionally maintained, fully insured, and ready for East Africa&apos;s roads.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-96 bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : isError || vehicles.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border">
              <CarFront className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl mb-2">Fleet loading unavailable</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                {isError
                  ? "Could not reach the API. Check that the backend is running and VITE_API_PROXY_TARGET is set."
                  : "No vehicles are published yet. Add vehicles in the admin dashboard."}
              </p>
              <Link href="/contact">
                <Button variant="outline">Contact us for a quote</Button>
              </Link>
            </div>
          ) : (
            <>
              <FleetControls
                categories={categoryOptions}
                categoryFilter={categoryFilter}
                onCategoryFilter={setCategoryFilter}
                sort={sort}
                onSort={setSort}
                resultCount={filtered.length}
              />

              {filtered.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border">
                  <p className="text-muted-foreground text-sm">
                    No vehicles in this category. Try another filter or{" "}
                    <button
                      type="button"
                      className="text-primary font-semibold hover:underline"
                      onClick={() => setCategoryFilter("All")}
                    >
                      view all
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {displayed.map((car, i) => (
                    <VehicleCard key={car.id} car={car} index={i} formatRatePerDay={formatRatePerDay} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="py-20 bg-primary">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-primary-foreground mb-4">
              Need a Custom Fleet Solution?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Corporate clients, NGOs, and government institutions can access long term leasing and tailored fleet packages.
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 font-display font-semibold uppercase tracking-wider text-sm border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                data-testid="button-custom-fleet"
              >
                Contact Our Team
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
