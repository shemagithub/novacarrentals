import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Car, ArrowRight } from "@phosphor-icons/react";
import { formatAxiosError } from "@/lib/api";
import { useBranding } from "@/contexts/BrandingContext";

const BG = "https://images.unsplash.com/photo-1761887301783-096897b74171?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwxfHxyZWQlMjB3aGl0ZSUyMG1pbmltYWwlMjBnZW9tZXRyaWMlMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzc4MjkzMzI1fDA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const { company_name, logoSrc } = useBranding();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@carrental.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(formatAxiosError(err.cause ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2" data-testid="login-page">
      {/* Form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-10 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-12">
            {logoSrc ? (
              <img src={logoSrc} alt="" className="w-9 h-9 object-contain border border-neutral-200 rounded-sm bg-white" />
            ) : (
              <div className="w-9 h-9 bg-[#E60000] flex items-center justify-center shrink-0">
                <Car size={20} weight="fill" className="text-white" />
              </div>
            )}
            <div>
              <div className="font-display font-bold text-lg tracking-tight leading-none" data-testid="login-company-name">{company_name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-1">Super Admin</div>
            </div>
          </div>

          <h1 className="mb-3 font-display text-3xl font-bold leading-none tracking-tighter sm:text-4xl">
            Control your fleet.
          </h1>
          <p className="mb-10 max-w-sm text-sm text-neutral-500">
            Sign in to manage vehicles, bookings, customers and the entire rental operation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] rounded-sm"
                required
                data-testid="login-email-input"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] rounded-sm"
                required
                data-testid="login-password-input"
              />
            </div>

            {error && (
              <div className="text-xs text-[#E60000] bg-red-50 border border-red-200 p-3 rounded-sm" data-testid="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E60000] hover:bg-[#CC0000] disabled:opacity-50 transition-colors text-white py-3 text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm"
              data-testid="login-submit-button"
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight size={14} weight="bold" />
            </button>
          </form>

          <div className="mt-12 pt-6 border-t border-neutral-200">
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold mb-2">
              Demo Credentials
            </div>
            <div className="font-mono text-xs text-neutral-700 space-y-0.5">
              <div>admin@carrental.com</div>
              <div>Admin@123</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual panel */}
      <div className="hidden lg:block relative bg-[#0A0A0A] overflow-hidden">
        <img src={BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-[#E60000]/20" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-3 opacity-80">
            {company_name} Operations Center
          </div>
          <h2 className="font-display font-bold text-4xl tracking-tight leading-tight max-w-md">
            Manage every vehicle, every booking, every dollar — in one place.
          </h2>
        </div>
        <div className="absolute top-12 right-12 text-white/70 text-[10px] uppercase tracking-[0.2em] font-mono">
          v1.0 · Production
        </div>
      </div>
    </div>
  );
}
