import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { Badge } from "@/components/ui/badge";

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  staffCount?: number;
}

const SHOWN = 8;
const TILT = 3;
const accent = (pct: number) => `color-mix(in oklab, var(--chart-1) ${pct}%, transparent)`;

/**
 * Bespoke role tile, not built on the shadcn Card.
 * The pointer spotlight (border + glow) and the slight tilt are driven by CSS variables written
 * straight to the element, so hovering never re-renders React. Skipped for touch and reduced motion.
 */
export function RoleCard({ role: r, onOpen }: { role: Role; onOpen?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const name = r.name.replace("_", " ");
  const resources = new Set(r.permissions.map((p) => p.split(":")[0])).size;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const b = el.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
    el.style.setProperty("--rx", `${(0.5 - y / b.height) * TILT * 2}deg`);
    el.style.setProperty("--ry", `${(x / b.width - 0.5) * TILT * 2}deg`);
    el.style.setProperty("--lift", "-3px");
  };

  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--lift", "0px");
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      {...(onOpen && {
        role: "button",
        tabIndex: 0,
        "aria-label": `Show the permissions of the ${name} role`,
        onClick: onOpen,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        },
      })}
      className={`group relative rounded-2xl p-px ${onOpen ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 " : ""} transition-[transform,box-shadow] duration-200 ease-out hover:shadow-2xl hover:shadow-chart-1/15 motion-reduce:transition-none`}
      style={{
        transform: "perspective(900px) translateY(var(--lift, 0px)) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
        // Hairline border with a bright spot that follows the cursor.
        background: `radial-gradient(260px circle at var(--mx, 50%) var(--my, 0%), ${accent(70)}, transparent 70%), var(--border)`,
      }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[15px] bg-card">
        {/* Soft glow under the cursor. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
          style={{ background: `radial-gradient(320px circle at var(--mx, 50%) var(--my, 0%), ${accent(12)}, transparent 70%)` }}
        />

        <div className="relative flex items-start justify-between gap-4 p-6 pb-5">
          {/* Dot texture, fading out toward the body of the card. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(color-mix(in oklab, var(--foreground) 16%, transparent) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              maskImage: "linear-gradient(to bottom, black, transparent 90%)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent 90%)",
            }}
          />
          <div className="relative flex min-w-0 items-center gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-base font-medium uppercase text-primary-foreground ring-4 ring-chart-1/15 transition-[box-shadow] duration-300 group-hover:ring-chart-1/30">
              {name.charAt(0)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-medium capitalize tracking-tight">{name}</h3>
              <p className="text-sm text-muted-foreground">
                {resources} {resources === 1 ? "area" : "areas"} of access
              </p>
            </div>
          </div>
          <div className="relative shrink-0 text-right">
            <p className="text-4xl font-medium leading-none tracking-tighter tabular-nums">{r.staffCount ?? 0}</p>
            <p className="mt-2 text-xs text-muted-foreground">staff</p>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col gap-4 px-6 pb-6">
          {r.description && <p className="text-sm leading-relaxed text-muted-foreground">{r.description}</p>}
          <div className="mt-auto flex flex-wrap gap-1.5">
            {r.permissions.slice(0, SHOWN).map((p) => (
              <Badge key={p} variant="secondary" className="font-mono text-[11px] font-normal transition-colors duration-200 group-hover:bg-chart-1/10">
                {p}
              </Badge>
            ))}
            {r.permissions.length > SHOWN && (
              <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground" title={r.permissions.slice(SHOWN).join(", ")}>
                +{r.permissions.length - SHOWN} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
