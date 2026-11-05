"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, ShieldCheck, BarChart3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { DEMO_PASSWORD, USERS } from "@/lib/seed";
import { Button, Field, describedBy, inputClass } from "@/components/ui";
import { Logo } from "@/components/logo";
import { useDocumentTitle } from "@/lib/hooks";

export default function LoginPage() {
  useDocumentTitle("Masuk");
  const router = useRouter();
  const { login, user, hydrated } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated && user) router.replace(user.role === "super_admin" ? "/admin" : "/dashboard");
  }, [hydrated, user, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Masukkan email sekolah Anda, misalnya nama@smklugina.sch.id.";
    if (!password) next.password = "Masukkan kata sandi Anda.";
    setErrors(next);
    setFormError("");
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setPending(true);
    const found = login(email, password);
    if (!found) {
      setPending(false);
      setFormError("Email atau kata sandi tidak cocok. Periksa ejaan email, lalu coba lagi. Jika lupa kata sandi, hubungi admin sekolah.");
      passwordRef.current?.select();
      return;
    }
    router.replace(found.role === "super_admin" ? "/admin" : "/dashboard");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="hidden flex-col justify-between bg-surface-inverse p-10 text-fg-inverse lg:flex">
        <Logo inverse />
        <div className="max-w-md">
          <p className="text-3xl leading-tight font-semibold tracking-[-0.02em]">
            Dengar suara siswa, ubah jadi data yang siap dibaca.
          </p>
          <ul className="mt-8 space-y-5 text-fg-inverse/80">
            <li className="flex gap-3">
              <ClipboardList aria-hidden className="mt-0.5 size-5 shrink-0" />
              <span>Susun survei Likert dan jawaban singkat dengan skala yang bisa diatur per pertanyaan.</span>
            </li>
            <li className="flex gap-3">
              <BarChart3 aria-hidden className="mt-0.5 size-5 shrink-0" />
              <span>Skor dasar dan distribusi jawaban dihitung otomatis setiap ada respons baru.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
              <span>Persetujuan responden tercatat, dan hasil technostress individual dibatasi.</span>
            </li>
          </ul>
        </div>
        <p className="text-sm text-fg-inverse/70">Modul 14 · Sistem Profil Talenta Digital SMK Lugina Rancaekek</p>
      </aside>

      <main id="main" className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 id="page-title" tabIndex={-1} className="mt-8 text-2xl font-semibold tracking-[-0.015em] outline-none lg:mt-0">
            Masuk ke Svara
          </h1>
          <p className="mt-1.5 text-fg-muted">Gunakan akun sekolah. Peran Anda ditentukan oleh sistem.</p>

          <form noValidate onSubmit={onSubmit} className="mt-8 space-y-5">
            <div role="alert" className="empty:hidden rounded-lg border border-danger-line bg-danger-soft p-3 text-sm text-danger-text">
              {formError}
            </div>
            <Field id="email" label="Email" error={errors.email}>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="nama@smklugina.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={describedBy("email", false, errors.email)}
                className={inputClass}
              />
            </Field>
            <Field id="password" label="Kata sandi" error={errors.password}>
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={describedBy("password", false, errors.password)}
                className={inputClass}
              />
            </Field>
            <Button type="submit" variant="primary" className="w-full" aria-disabled={pending || undefined}>
              {pending ? "Memeriksa…" : "Masuk"}
            </Button>
          </form>

          <section aria-labelledby="demo-title" className="mt-10 rounded-xl border border-line bg-surface p-4">
            <h2 id="demo-title" className="text-sm font-semibold">
              Akun demo
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Kata sandi semua akun: <code className="font-mono text-fg">{DEMO_PASSWORD}</code>
            </p>
            <ul className="mt-3 divide-y divide-line">
              {USERS.filter((u) => u.id !== "usr-dedi").map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{u.role === "super_admin" ? "Super admin" : `Creator · ${u.name}`}</p>
                    <p className="text-sm break-all text-fg-muted">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    aria-label={`Isi akun ${u.role === "super_admin" ? "super admin" : u.name}`}
                    onClick={() => {
                      setEmail(u.email);
                      setPassword(DEMO_PASSWORD);
                      setErrors({});
                      setFormError("");
                    }}
                  >
                    Isi akun
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
