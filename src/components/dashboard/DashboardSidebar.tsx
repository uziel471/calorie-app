"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Flame, LayoutDashboard, UtensilsCrossed, TrendingUp,
  Settings, LogOut, ChevronRight, X, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  user: { name?: string | null; email?: string | null };
}

const navItems = [
  { href: "/dashboard",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/meals",    label: "Comidas",   icon: UtensilsCrossed },
  { href: "/dashboard/progress", label: "Progreso",  icon: TrendingUp },
  { href: "/dashboard/settings", label: "Ajustes",   icon: Settings },
];

/* ── Shared nav link ──────────────────────────────────────────────────── */
function NavLink({
  href, label, icon: Icon, active, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="w-3 h-3 text-primary/60" />}
    </Link>
  );
}

/* ── Desktop sidebar (hidden on mobile) ───────────────────────────────── */
function DesktopSidebar({ user }: Props) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-64 shrink-0 border-r border-border/50 flex-col bg-card/30 backdrop-blur-sm">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Flame className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "Syne, sans-serif" }}>
            CalorieTrack
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} active={pathname === href} />
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}

/* ── Mobile top bar + bottom tab nav ─────────────────────────────────── */
function MobileNav({ user }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentPage = navItems.find((n) => n.href === pathname);

  return (
    <>
      {/* Top bar */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-card/80 backdrop-blur-md border-b border-border/50"
        style={{ paddingTop: "var(--sat)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow shadow-primary/30">
            <Flame className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-base" style={{ fontFamily: "Syne, sans-serif" }}>
            CalorieTrack
          </span>
        </div>

        {currentPage && (
          <span className="text-xs font-medium text-muted-foreground">
            {currentPage.label}
          </span>
        )}

        {/* Hamburger — opens side drawer for user info + logout */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="Menú"
        >
          <Menu className="w-4 h-4" />
        </button>
      </header>

      {/* Bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/90 backdrop-blur-md border-t border-border/50 flex"
        style={{ paddingBottom: "var(--sab)" }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                active ? "bg-primary/15" : ""
              )}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className={cn("text-[10px] font-medium", active && "text-primary")}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Side drawer (user info + logout) */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 nav-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-card border-l border-border/50 flex flex-col slide-up"
            style={{ paddingTop: "var(--sat)", paddingBottom: "var(--sab)" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <span className="font-bold text-sm">Mi cuenta</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User info */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Nav links in drawer */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(({ href, label, icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={pathname === href}
                  onClick={() => setDrawerOpen(false)}
                />
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ── Public export ────────────────────────────────────────────────────── */
export function DashboardSidebar({ user }: Props) {
  return (
    <>
      <DesktopSidebar user={user} />
      <MobileNav user={user} />
    </>
  );
}
