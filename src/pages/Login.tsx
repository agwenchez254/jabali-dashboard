import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CircleAlert, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/api/auth";
import { errorMessage } from "@/api/baseApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";
import { ThemeToggle } from "@/components/layout/AppLayout";

const schema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });
type Values = z.infer<typeof schema>;

/** Brand panel. The light follows the pointer by writing CSS variables straight to the element, so moving the mouse never re-renders React. */
function BrandPanel() {
  const panel = useRef<HTMLElement>(null);
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = panel.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    el.style.setProperty("--nx", (x * 2 - 1).toFixed(3));
    el.style.setProperty("--ny", (y * 2 - 1).toFixed(3));
  };
  return (
    <aside
      ref={panel}
      onPointerMove={onMove}
      className="relative hidden overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-14"
    >
      {/* Quiet depth: a darkening towards the foot of the panel, a faint light that follows the pointer, and a watermark that leans away from it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, color-mix(in oklch, var(--sidebar) 78%, black))" }} />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(480px circle at var(--mx, 30%) var(--my, 35%), color-mix(in oklch, var(--sidebar-active) 16%, transparent), transparent 65%)" }}
        />
        <div className="absolute -bottom-28 -right-28 transition-transform duration-500 ease-out" style={{ transform: "translate3d(calc(var(--nx, 0) * -16px), calc(var(--ny, 0) * -16px), 0)" }}>
          <BrandMark className="size-[30rem] opacity-[0.05]" />
        </div>
      </div>

      <div className="login-rise relative" style={{ "--i": 0 } as React.CSSProperties}>
        <BrandLogo onDark className="h-14" />
      </div>

      <div className="relative max-w-md space-y-5">
        <h1 className="login-rise text-4xl font-medium leading-[1.12] tracking-[-0.02em] text-sidebar-accent-foreground xl:text-[2.75rem]" style={{ "--i": 2 } as React.CSSProperties}>
          Run your store from one place.
        </h1>
        <p className="login-rise max-w-[36ch] text-base leading-relaxed text-sidebar-foreground/80" style={{ "--i": 3 } as React.CSSProperties}>
          Orders, stock, customers and content, all in one dashboard.
        </p>
      </div>

      <p className="login-rise relative text-sm text-sidebar-foreground/70" style={{ "--i": 4 } as React.CSSProperties}>
        &copy; {new Date().getFullYear()} Jabali
      </p>
    </aside>
  );
}

export default function Login() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [login, { isLoading, error }] = useLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (token) return <Navigate to={from} replace />;

  const onSubmit = async (v: Values) => {
    try {
      const r = await login(v).unwrap();
      dispatch(setCredentials({ user: r.user, accessToken: r.accessToken, refreshToken: r.refreshToken }));
      navigate(from, { replace: true });
    } catch {
      setAttempts((n) => n + 1); // re-keys the error so it shakes again on every failed try
    }
  };

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <main className="relative flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="login-rise mb-10 lg:hidden" style={{ "--i": 0 } as React.CSSProperties}>
            <BrandLogo className="h-14" />
          </div>

          <div className="login-rise space-y-2" style={{ "--i": 1 } as React.CSSProperties}>
            <h2 className="text-2xl font-medium tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to manage your store.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <div className="login-rise space-y-2" style={{ "--i": 2 } as React.CSSProperties}>
              <Label htmlFor="email">Email</Label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-ring" />
                <Input id="email" type="email" autoComplete="username" autoFocus placeholder="you@jabali.com" className="h-11 pl-10" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
              </div>
              {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="login-rise space-y-2" style={{ "--i": 3 } as React.CSSProperties}>
              <Label htmlFor="password">Password</Label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-ring" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-11 pl-10 pr-11"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : capsLock ? "caps-hint" : undefined}
                  {...register("password", {
                    onBlur: () => setCapsLock(false),
                  })}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  onMouseDown={(e) => e.preventDefault()} // keep the caret in the field while toggling
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                  aria-controls="password"
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="text-sm text-destructive">{errors.password.message}</p>}
              {!errors.password && capsLock && (
                <p id="caps-hint" className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CircleAlert className="size-4" /> Caps Lock is on
                </p>
              )}
            </div>

            {error && (
              <div key={attempts} role="alert" className="login-shake flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{errorMessage(error)}</span>
              </div>
            )}

            <div className="login-rise" style={{ "--i": 4 } as React.CSSProperties}>
              <Button type="submit" size="lg" className="group h-11 w-full gap-2 transition-transform active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Signing in
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="login-rise mt-8 text-center text-xs text-muted-foreground" style={{ "--i": 5 } as React.CSSProperties}>
            Authorised staff only.
          </p>
        </div>
      </main>
    </div>
  );
}
