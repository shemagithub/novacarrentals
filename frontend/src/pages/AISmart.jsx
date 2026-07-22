import { useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Sparkle, Lightning, ChartLine, Robot, ShieldWarning, Wrench, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function AISmart() {
  return (
    <div data-testid="ai-page">
      <PageHeader title="AI Smart Features" description="Claude Sonnet 4.5 powered intelligence for your fleet — recommendations, dynamic pricing, and demand forecasting." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecommendationCard />
        <DynamicPricingCard />
        <DemandPredictionCard />
      </div>

      <div className="mt-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-3">Coming next phase</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComingSoonCard icon={ShieldWarning} title="Fraud Detection" desc="Flag suspicious bookings, fake licenses and high-risk transactions." />
          <ComingSoonCard icon={Wrench} title="Predictive Maintenance" desc="Anticipate service needs by mileage, age and prior incidents." />
          <ComingSoonCard icon={Robot} title="Conversational Insights" desc="Ask questions in plain English — &quot;Why are SUV bookings down 12%?&quot;" />
        </div>
      </div>
    </div>
  );
}

function RecommendationCard() {
  const [prefs, setPrefs] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult("");
    try {
      const { data } = await api.post("/ai/recommend", { preferences: prefs });
      setResult(data.recommendation);
    } catch (e) {
      toast.error(e.response?.data?.detail || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sharp-card p-5 flex flex-col" data-testid="ai-recommendation-card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-[#FFF5F5] flex items-center justify-center">
          <Sparkle size={20} className="text-[#E60000]" weight="duotone" />
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">Live</span>
      </div>
      <div className="font-display font-bold text-lg tracking-tight mb-1">Car Recommendation</div>
      <p className="text-xs text-neutral-500 mb-3">Get AI-suggested vehicles for any customer brief.</p>

      <textarea
        value={prefs}
        onChange={(e) => setPrefs(e.target.value)}
        placeholder="e.g. Family of 4, 5-day road trip, want SUV with good fuel economy"
        rows={3}
        className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs focus:outline-none focus:border-[#E60000] rounded-sm mb-3"
        data-testid="ai-recommend-prefs"
      />
      <button
        onClick={run}
        disabled={loading}
        className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-sm flex items-center justify-center gap-2"
        data-testid="ai-recommend-run"
      >
        {loading ? "Thinking..." : "Get Recommendation"}
        {!loading && <ArrowRight size={12} weight="bold" />}
      </button>

      {result && (
        <div className="mt-4 bg-neutral-50 border border-neutral-200 p-3 text-xs whitespace-pre-wrap leading-relaxed font-mono" data-testid="ai-recommend-result">
          {result}
        </div>
      )}
    </div>
  );
}

function DynamicPricingCard() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult("");
    try {
      const { data } = await api.post("/ai/dynamic-pricing");
      setResult(data.suggestions);
    } catch (e) {
      toast.error(e.response?.data?.detail || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sharp-card p-5 flex flex-col" data-testid="ai-pricing-card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-[#FFF5F5] flex items-center justify-center">
          <Lightning size={20} className="text-[#E60000]" weight="duotone" />
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">Live</span>
      </div>
      <div className="font-display font-bold text-lg tracking-tight mb-1">Dynamic Pricing</div>
      <p className="text-xs text-neutral-500 mb-3">AI suggests price adjustments based on real demand.</p>

      <button
        onClick={run}
        disabled={loading}
        className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 mt-auto"
        data-testid="ai-pricing-run"
      >
        {loading ? "Analyzing..." : "Generate Suggestions"}
        {!loading && <ArrowRight size={12} weight="bold" />}
      </button>

      {result && (
        <div className="mt-4 bg-neutral-50 border border-neutral-200 p-3 text-xs whitespace-pre-wrap leading-relaxed font-mono max-h-72 overflow-y-auto" data-testid="ai-pricing-result">
          {result}
        </div>
      )}
    </div>
  );
}

function DemandPredictionCard() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult("");
    try {
      const { data } = await api.post("/ai/demand-prediction");
      setResult(data.forecast);
    } catch (e) {
      toast.error(e.response?.data?.detail || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sharp-card p-5 flex flex-col" data-testid="ai-demand-card">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-[#FFF5F5] flex items-center justify-center">
          <ChartLine size={20} className="text-[#E60000]" weight="duotone" />
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5">Live</span>
      </div>
      <div className="font-display font-bold text-lg tracking-tight mb-1">Demand Forecast</div>
      <p className="text-xs text-neutral-500 mb-3">30-day demand outlook by vehicle category.</p>

      <button
        onClick={run}
        disabled={loading}
        className="bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 mt-auto"
        data-testid="ai-demand-run"
      >
        {loading ? "Forecasting..." : "Generate Forecast"}
        {!loading && <ArrowRight size={12} weight="bold" />}
      </button>

      {result && (
        <div className="mt-4 bg-neutral-50 border border-neutral-200 p-3 text-xs whitespace-pre-wrap leading-relaxed font-mono max-h-72 overflow-y-auto" data-testid="ai-demand-result">
          {result}
        </div>
      )}
    </div>
  );
}

function ComingSoonCard({ icon: Icon, title, desc }) {
  return (
    <div className="sharp-card p-5 opacity-80">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center">
          <Icon size={20} className="text-neutral-500" weight="duotone" />
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5">Phase 2</span>
      </div>
      <div className="font-display font-bold text-lg tracking-tight mb-1.5">{title}</div>
      <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  );
}
