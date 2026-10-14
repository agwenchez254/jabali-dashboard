import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { ChevronsUpDown, ClipboardList, FileText, Gift, History, ImageIcon, LayoutDashboard, LogOut, Moon, Package, Settings, ShoppingBag, Sun, Tag, Truck, User, Users, Warehouse } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loggedOut } from "@/store/authSlice";
import { baseApi } from "@/api/baseApi";
import { useLogoutMutation } from "@/api/auth";
import { initials } from "@/lib/format";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm?: string;
}

const groups: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, perm: "analytics:read" }] },
  {
    label: "Catalogue",
    items: [
      { to: "/products", label: "Products", icon: ShoppingBag, perm: "product:read" },
      { to: "/inventory", label: "Inventory", icon: Warehouse, perm: "inventory:read" },
      { to: "/media", label: "Media", icon: ImageIcon, perm: "media:read" },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/orders", label: "Orders", icon: Package, perm: "order:read" },
      { to: "/promotions", label: "Promotions", icon: Tag, perm: "promotion:read" },
      { to: "/delivery", label: "Delivery", icon: Truck, perm: "delivery:read" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/content", label: "Site content", icon: FileText, perm: "content:read" },
      { to: "/testimonials", label: "Testimonials", icon: Gift, perm: "content:read" },
    ],
  },
  {
    label: "Admin",
    items: [
      { to: "/staff", label: "Staff and roles", icon: Users, perm: "staff:read" },
      { to: "/audit", label: "Audit log", icon: History, perm: "audit:read" },
      { to: "/settings", label: "Site settings", icon: Settings, perm: "settings:read" },
    ],
  },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">J</span>
      <span className="text-base font-medium tracking-tight group-data-[collapsible=icon]:hidden">Jabali</span>
      <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Admin</span>
    </Link>
  );
}

function AppSidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const { setOpenMobile } = useSidebar();
  const can = (p?: string) => !p || user?.permissions.includes(p);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => {
          const items = g.items.filter((i) => can(i.perm));
          if (!items.length) return null;
          return (
            <SidebarGroup key={g.label}>
              <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((i) => (
                    <SidebarMenuItem key={i.to}>
                      <NavLink to={i.to} end={i.to === "/"} onClick={() => setOpenMobile(false)}>
                        {({ isActive }) => (
                          <SidebarMenuButton asChild isActive={isActive} tooltip={i.label}>
                            <span>
                              <i.icon />
                              <span>{i.label}</span>
                            </span>
                          </SidebarMenuButton>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
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

export function AppLayout() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu variant="header" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
