import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { errorMessage } from "../../services/api";
import { usePageMeta } from "../../hooks/usePageMeta";
import { OwlMark } from "../../components/Logo";

const SPECS = [
  { label: "auth", value: "JWT · bcrypt · httpOnly", tone: "text-bone" },
  { label: "scope", value: "articles · categories · tags", tone: "text-bone" },
  { label: "session", value: "expires in 7d", tone: "text-ok" },
];

const INPUT = "field !py-3 !text-[16px]";
const LABEL = "mb-2 block text-[15px] font-semibold text-bone";

export default function AdminLogin() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  usePageMeta({ title: "Admin sign in", description: "Journal administration." });

  const from = (location.state as { from?: string } | null)?.from || "/admin";

  if (!loading && user) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="hidden flex-col justify-between bg-paper-2 p-14 lg:flex">
        <div className="flex items-center gap-4">
          <OwlMark size={40} />
          <span className="font-serif text-[22px] leading-[1.15] font-medium tracking-[-0.01em] text-bone">
            Glorison
            <br />
            Cyber Journal
          </span>
        </div>

        <div className="max-w-lg">
          <p className="text-[16px] font-medium text-signal">Restricted / editorial desk</p>
          <h1 className="display mt-5 font-serif text-[clamp(2.4rem,4.4vw,3.8rem)] leading-[1.04] font-medium tracking-[-0.025em] text-bone">
            The desk where entries are filed.
          </h1>
          <p className="mt-6 text-[17px] leading-relaxed text-bone-dim">
            Authentication is enforced server-side with an HttpOnly session cookie. Only the
            administrator account can create, edit or unpublish anything in the journal.
          </p>

          <dl className="mt-10">
            {SPECS.map((spec) => (
              <div key={spec.label} className="flex items-baseline gap-3 py-1.5">
                <dt className="text-[16px] text-dim">{spec.label}</dt>
                <span className="leader" aria-hidden="true" />
                <dd className={`mono text-[14px] ${spec.tone}`}>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-[14px] text-dim">
          Unauthorised access is prohibited · All actions are logged
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 lg:hidden">
            <OwlMark size={34} />
            <span className="font-serif text-[19px] font-medium text-bone">Journal / Admin</span>
          </div>

          <div className="mt-8 flex items-center gap-2 text-dim lg:mt-0">
            <Lock size={15} />
            <span className="text-[15px]">Administrator sign in</span>
          </div>

          <h2 className="mt-4 font-serif text-[34px] leading-tight font-medium tracking-[-0.02em] text-bone">
            Welcome back.
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-dim">
            Use the seeded administrator credentials from your server environment.
          </p>

          <form onSubmit={submit} className="mt-9 space-y-6">
            <div>
              <label htmlFor="identifier" className={LABEL}>
                Email or username
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className={INPUT}
                placeholder="admin@glorison.local"
              />
            </div>

            <div>
              <label htmlFor="password" className={LABEL}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={INPUT}
                placeholder="••••••••••"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-sm border border-l-[3px] border-rule border-l-signal bg-paper px-4 py-3 text-[15px] leading-snug text-signal"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary !min-h-12 w-full !text-[16px]"
              disabled={submitting}
            >
              {submitting ? "Authenticating…" : "Sign in"}
            </button>
          </form>

          <a
            href="/"
            className="mt-9 inline-flex items-center gap-2 text-[15px] text-dim underline decoration-ghost underline-offset-4 transition-colors hover:text-bone"
          >
            <ArrowLeft size={15} /> Back to the journal
          </a>
        </div>
      </section>
    </div>
  );
}