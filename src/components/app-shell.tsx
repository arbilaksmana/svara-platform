"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, ListChecks, LogOut, RotateCcw, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useRouteFocus } from "@/lib/hooks";
import type { Role } from "@/lib/types";
import { Logo } from "./logo";
import { Button, ButtonLink, Dialog, EmptyState, cx } from "./ui";
import { useToast } from "./toast";

const NAV: Record<Role, { href: string; label: string; Icon: typeof LayoutDashboard }[]> = {
  creator: [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/surveys", label: "Survei", Icon: ListChecks },
  ],
  super_admin: [{ href: "/admin", label: "Ikhtisar sistem", Icon: ShieldCheck }],
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, hydrated, logout, resetDemo } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  useRouteFocus();

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <span className="text-sm text-fg-muted">Memuat ruang kerja…</span>
      </div>
    );
  }

  const nav = NAV[user.role];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const navLinks = (variant: "side" | "top") =>
    nav.map(({ href, label, Icon }) => (
      <li key={href}>
        <Link
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cx(
            "flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-[background-color,color] duration-150",
            isActive(href) ? "bg-accent-soft text-accent-text" : "text-fg-muted hover:bg-surface-muted hover:text-fg",
            variant === "top" && "whitespace-nowrap",
          )}
        >
          <Icon aria-hidden className="size-4" />
          {label}
        </Link>
      </li>
    ));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Langsung ke konten
      </a>

      {/* Desktop sidebar */}
      <aside aria-label="Sidebar" className="sticky top-0 hidden h-dvh flex-col border-e border-line bg-surface lg:flex">
        <div className="px-5 pt-5 pb-6">
          <Logo />
        </div>
        <nav aria-label="Navigasi utama" className="px-3">
          <ul className="space-y-1">{navLinks("side")}</ul>
        </nav>
        <div className="mt-auto space-y-3 border-t border-line p-4">
          <div className="min-w-0 px-3">
            <p className="text-sm font-medium break-words">{user.name}</p>
            <p className="text-sm break-words text-fg-muted">{user.title}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="sm" className="justify-start" onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden className="size-4" />
              Atur ulang data demo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut aria-hidden className="size-4" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Logo compact />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut aria-hidden className="size-4" />
            Keluar
          </Button>
        </div>
        <nav aria-label="Navigasi utama" className="px-2 pb-2">
          <ul className="flex flex-wrap gap-1">{navLinks("top")}</ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="min-w-0 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Atur ulang data demo?"
        description="Semua survei, respons, dan log yang Anda buat di browser ini akan diganti dengan data contoh awal. Tindakan ini tidak bisa dibatalkan."
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>Batal</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
                toast({ message: "Data demo dikembalikan ke kondisi awal." });
              }}
            >
              Atur ulang data
            </Button>
          </>
        }
      />
    </div>
  );
}

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user } = useStore();
  if (user?.role !== role) {
    const home = user?.role === "super_admin" ? "/admin" : "/dashboard";
    return (
      <EmptyState
        icon={<ShieldCheck aria-hidden className="size-8" />}
        title={role === "super_admin" ? "Halaman ini khusus super admin" : "Halaman ini khusus creator survei"}
        body="Akun Anda tidak memiliki akses ke halaman ini. Jika Anda membutuhkannya, minta admin sekolah mengubah peran akun Anda."
        action={
          <ButtonLink href={home} variant="primary">
            Buka halaman utama saya
          </ButtonLink>
        }
      />
    );
  }
  return <>{children}</>;
}
