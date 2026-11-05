import { Logo } from "./logo";

export function PublicFrame({ children, banner }: { children: React.ReactNode; banner?: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      {banner}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <span className="text-end text-sm text-fg-muted">SMK Lugina Rancaekek</span>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
