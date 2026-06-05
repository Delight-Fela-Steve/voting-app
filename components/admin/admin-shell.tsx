"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/admin/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role } from "@prisma/client";

type AdminShellProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role: Role;
  };
  children: React.ReactNode;
};

function roleLabel(role: Role): string {
  return role === "SUPER_ADMIN" ? "Super admin" : "Admin";
}

type NavItem = {
  href: string;
  label: string;
  superAdminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/users", label: "Users", superAdminOnly: true },
  { href: "/admin/invitations", label: "Invitations", superAdminOnly: true },
  { href: "/admin/settings", label: "Settings", superAdminOnly: true },
  { href: "/admin/profile", label: "Profile" },
];

function NavLinks({
  pathname,
  isSuperAdmin,
  onNavigate,
}: {
  pathname: string;
  isSuperAdmin: boolean;
  onNavigate?: () => void;
}) {
  const visibleItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin,
  );

  return (
    <nav className="flex flex-col gap-1">
      {visibleItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "border-l-2 border-accent bg-accent/10 pl-[10px] text-text-primary"
                : "border-l-2 border-transparent text-text-muted hover:bg-surface-raised hover:text-text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="border-b border-border px-5 py-5">
          <Link href="/admin" className="text-base font-bold text-text-primary">
            Voting App
          </Link>
          <p className="mt-0.5 text-xs text-text-muted">Admin panel</p>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <NavLinks pathname={pathname} isSuperAdmin={isSuperAdmin} />

          <div className="mt-8 space-y-3 border-t border-border pt-4">
            <div className="px-3">
              <p className="truncate text-sm font-medium text-text-primary">
                {user.name ?? user.email}
              </p>
              <span className="mt-1 inline-flex rounded-full bg-surface-raised px-2 py-0.5 text-xs font-medium text-text-muted">
                {roleLabel(user.role)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3">
              <ThemeToggle />
              <LogoutButton className="flex-1" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header + drawer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <Link href="/admin" className="text-sm font-bold text-text-primary">
            Voting App
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-lg border border-border p-2 text-text-muted hover:bg-surface-raised"
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
              <MenuIcon />
            </button>
          </div>
        </header>

        {mobileOpen ? (
          <div className="border-b border-border bg-surface p-4 md:hidden">
            <NavLinks
              pathname={pathname}
              isSuperAdmin={isSuperAdmin}
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <p className="px-3 text-sm text-text-muted">
                {user.name ?? user.email}
              </p>
              <LogoutButton className="w-full" />
            </div>
          </div>
        ) : null}

        <div className="flex-1 bg-bg">{children}</div>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
