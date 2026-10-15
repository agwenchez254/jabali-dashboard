import { useEffect, useState } from "react";
import { BrandLogo, BrandMark } from "@/components/BrandLogo";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Boxes, ChevronRight, ChevronsUpDown, PenLine, Receipt, ShieldCheck, ClipboardList, FileText, Gift, History, ImageIcon, LayoutDashboard, LogOut, Moon, Package, Settings, ShoppingBag, Sun, Tag, Truck, User, UserRound, Newspaper, Users, Warehouse } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loggedOut } from "@/store/authSlice";
import { baseApi } from "@/api/baseApi";
import { useLogoutMutation, useSyncSessionMutation } from "@/api/auth";
import { initials } from "@/lib/format";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { NotificationBell } from "@/notifications/NotificationBell";
import { useAdminNotifications } from "@/notifications/useAdminNotifications";
import { unlockAudio } from "@/lib/chime";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm?: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
}

const dashboard: NavItem = { to: "/", label: "Dashboard", icon: LayoutDashboard, perm: "analytics:read" };

/** Expandable sections. Each shows only the pages the signed-in person may open. */
const sections: NavSection[] = [
  {
    id: "catalogue",
    label: "Catalogue",
    icon: Boxes,
    items: [
      { to: "/products", label: "Products", icon: ShoppingBag, perm: "product:read" },
      { to: "/inventory", label: "Inventory", icon: Warehouse, perm: "inventory:read" },
      { to: "/media", label: "Media", icon: ImageIcon, perm: "media:read" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: Receipt,
    items: [
      { to: "/orders", label: "Orders", icon: Package, perm: "order:read" },
      { to: "/customers", label: "Customers", icon: UserRound, perm: "customer:read" },
      { to: "/promotions", label: "Promotions", icon: Tag, perm: "promotion:read" },
      { to: "/delivery", label: "Delivery", icon: Truck, perm: "delivery:read" },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: PenLine,
    items: [
      { to: "/content", label: "Site content", icon: FileText, perm: "content:read" },
      { to: "/blog", label: "Blog", icon: Newspaper, perm: "blog:read" },
      { to: "/testimonials", label: "Testimonials", icon: Gift, perm: "content:read" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    items: [
      { to: "/staff", label: "Staff and roles", icon: Users, perm: "staff:read" },
      { to: "/audit", label: "Audit log", icon: History, perm: "audit:read" },
      { to: "/settings", label: "Site settings", icon: Settings, perm: "settings:read" },
    ],
  },
];

const OPEN_KEY = "jabali-admin-nav-open";

function loadOpen(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveOpen(v: Record<string, boolean>) {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable: the menu still works, it just forgets */
  }
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
      <BrandMark className="hidden size-8 shrink-0 group-data-[collapsible=icon]:block" />
      <span className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
        <BrandLogo className="h-10" onDark />
        <span className="text-xs text-muted-foreground">Admin</span>
      </span>
    </Link>
  );
}

function NavSectionMenu({ section, items, open, onOpen, onNavigate }: { section: NavSection; items: NavItem[]; open: boolean; onOpen: (v: boolean) => void; onNavigate: () => void }) {
  const { pathname } = useLocation();
  const { state, setOpen } = useSidebar();
  const active = items.some((i) => (i.to === "/" ? pathname === "/" : pathname === i.to || pathname.startsWith(`${i.to}/`)));
  return (
    <Collapsible open={open} onOpenChange={onOpen} asChild className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={section.label}
            isActive={active && !open}
            onClick={(e) => {
              // In the icon-only rail there is no room for a submenu: widen the sidebar instead of toggling it.
              if (state === "collapsed") {
                e.preventDefault();
                setOpen(true);
                onOpen(true);
              }
            }}
          >
            <section.icon />
            <span>{section.label}</span>
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((i) => (
              <SidebarMenuSubItem key={i.to}>
                <NavLink to={i.to} onClick={onNavigate}>
                  {({ isActive }) => (
                    <SidebarMenuSubButton asChild isActive={isActive}>
                      <span>
                        <i.icon />
                        <span>{i.label}</span>
                      </span>
                    </SidebarMenuSubButton>
                  )}
                </NavLink>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function AppSidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const { pathname } = useLocation();
  const [syncSession] = useSyncSessionMutation();
  // Pick up role changes (e.g. a new Customers permission) without making the person sign in again.
  useEffect(() => {
    void syncSession();
  }, [syncSession]);
  const { setOpenMobile } = useSidebar();
  const can = (p?: string) => !p || user?.permissions.includes(p);
  const [openState, setOpenState] = useState<Record<string, boolean>>(loadOpen);

  const visible = (sec: NavSection) => ({ section: sec, items: sec.items.filter((i) => can(i.perm)) }).items.length > 0;
  const isOpen = (sec: NavSection) => {
    // A section holding the current page starts open; otherwise the saved choice wins, closed by default.
    const holdsPage = sec.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
    return openState[sec.id] ?? holdsPage;
  };
  const setSection = (sec: NavSection) => (v: boolean) =>
    setOpenState((o) => {
      const next = { ...o, [sec.id]: v };
      saveOpen(next);
      return next;
    });
  const menu = (sec: NavSection) => (
    <NavSectionMenu key={sec.id} section={sec} items={sec.items.filter((i) => can(i.perm))} open={isOpen(sec)} onOpen={setSection(sec)} onNavigate={() => setOpenMobile(false)} />
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {can(dashboard.perm) && (
                <SidebarMenuItem>
                  <NavLink to={dashboard.to} end onClick={() => setOpenMobile(false)}>
                    {({ isActive }) => (
                      <SidebarMenuButton asChild isActive={isActive} tooltip={dashboard.label}>
                        <span>
                          <dashboard.icon />
                          <span>{dashboard.label}</span>
                        </span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              )}
              {sections.filter(visible).map(menu)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu variant="sidebar" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

function UserMenu({ variant }: { variant: "sidebar" | "header" }) {
  const user = useAppSelector((s) => s.auth.user);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  if (!user) return null;

  const signOut = async () => {
    try {
      await logout({ refreshToken: refreshToken ?? undefined }).unwrap();
    } catch {
      /* token may already be invalid; sign out locally regardless */
    }
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState());
    navigate("/login", { replace: true });
  };

  const avatar = (
    <Avatar className="size-8 rounded-lg">
      <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
            {avatar}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs capitalize text-muted-foreground">{user.role.replace("_", " ")}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        ) : (
          <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label="Account menu">
            {avatar}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={variant === "sidebar" ? "right" : "bottom"} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <User /> Profile
        </DropdownMenuItem>
        {user.permissions.includes("settings:read") && (
          <DropdownMenuItem onSelect={() => navigate("/settings")}>
            <Settings /> Site settings
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => navigate("/audit")} className={user.permissions.includes("audit:read") ? "" : "hidden"}>
          <ClipboardList /> Activity
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} variant="destructive">
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Keeps the live order stream open while the dashboard is showing. Draws nothing. */
function LiveOrders() {
  useAdminNotifications();
  // Browsers keep sound off until the person has interacted with the page.
  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);
  return null;
}

export function AppLayout() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <SidebarProvider>
      <LiveOrders />
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu variant="header" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
      </SidebarInset>
      <ThemeCustomizer />
    </SidebarProvider>
  );
}
