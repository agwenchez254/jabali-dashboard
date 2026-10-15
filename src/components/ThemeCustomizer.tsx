import { useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { accents, accentSwatch, applyTheme, defaultTheme, loadTheme, saveTheme, sidebars, sidebarSwatch, type ThemeChoice } from "@/lib/themes";
import { cn } from "@/lib/utils";

const modes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

const tile = "relative rounded-lg border bg-card p-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-foreground aria-pressed:bg-muted";

/** Floating tab on the right edge that opens the theme picker. Changes apply live and are remembered on this device. */
export function ThemeCustomizer() {
  const [theme, setTheme] = useState<ThemeChoice>(loadTheme);
  const { theme: mode, setTheme: setMode } = useTheme();

  const choose = (next: ThemeChoice) => {
    setTheme(next);
    applyTheme(next);
    saveTheme(next);
  };

  const current = accents.find((a) => a.id === theme.accent) ?? accents[0];
  const matched = current.pair === theme.sidebar;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Customise theme"
          title="Customise theme"
          className="fixed right-0 top-1/2 z-30 grid h-11 w-10 -translate-y-1/2 place-items-center rounded-l-lg border border-r-0 bg-primary text-primary-foreground shadow-md outline-none transition-[width] hover:w-12 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Palette className="size-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] gap-6 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customise theme</DialogTitle>
          <DialogDescription>Pick an accent and a sidebar colour. Changes apply straight away and are kept on this device.</DialogDescription>
        </DialogHeader>

        <Section title="Accent colour" hint="Buttons, focus rings, charts and the active menu item.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {accents.map((a) => (
              <button key={a.id} type="button" aria-pressed={theme.accent === a.id} onClick={() => choose({ ...theme, accent: a.id })} className={cn(tile, "flex items-center gap-2")}>
                <span className="size-6 shrink-0 rounded-md" style={{ background: accentSwatch(a) }} />
                <span className="flex-1">{a.label}</span>
                {theme.accent === a.id && <Check className="size-4" />}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Sidebar colour" hint={`${current.label} pairs best with ${sidebars.find((s) => s.id === current.pair)?.label}, the colour opposite it.`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sidebars.map((s) => (
              <button key={s.id} type="button" aria-pressed={theme.sidebar === s.id} onClick={() => choose({ ...theme, sidebar: s.id })} className={cn(tile, "space-y-2")}>
                <span className="relative flex h-10 items-center rounded-md border px-2" style={{ background: sidebarSwatch(s) }}>
                  <span className="h-3 w-full rounded-sm bg-sidebar-active" />
                </span>
                <span className="flex items-center justify-between gap-1">
                  <span>{s.label}</span>
                  {theme.sidebar === s.id ? <Check className="size-4" /> : s.id === current.pair ? <span className="text-xs text-muted-foreground">Pairs</span> : null}
                </span>
              </button>
            ))}
          </div>
          {!matched && (
            <Button type="button" variant="outline" size="sm" onClick={() => choose({ ...theme, sidebar: current.pair })}>
              Use matching sidebar
            </Button>
          )}
        </Section>

        <Section title="Mode">
          <div className="grid grid-cols-3 gap-2">
            {modes.map((m) => (
              <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} className={cn(tile, "flex items-center justify-center gap-2")}>
                <m.icon className="size-4" />
                {m.label}
              </button>
            ))}
          </div>
        </Section>

        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => choose(defaultTheme)}>
            Reset to default
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
