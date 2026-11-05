"use client";

import Link from "next/link";
import { ClipboardList, Inbox, Lock, Radio } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/hooks";
import { formatNumber } from "@/lib/survey";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { RequireRole } from "@/components/app-shell";
import { SurveyList } from "@/components/survey-list";
import { NewSurveyButton } from "@/components/new-survey";

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  return (
    <RequireRole role="creator">
      <Dashboard />
    </RequireRole>
  );
}

function Dashboard() {
  const { user, surveys, responses } = useStore();
  const mine = surveys.filter((s) => s.ownerId === user?.id);
  const myIds = new Set(mine.map((s) => s.id));
  const active = mine.filter((s) => s.status === "published");
  const closed = mine.filter((s) => s.status === "closed");
  const total = responses.filter((r) => myIds.has(r.surveyId)).length;
  const recent = [...mine]
    .filter((s) => s.status !== "archived")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Halo, ${user?.name.split(" ")[0]}`}
        description="Pantau survei yang sedang berjalan dan lanjutkan draf Anda."
        actions={<NewSurveyButton />}
      />

      <section aria-label="Ringkasan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<ClipboardList aria-hidden />} label="Total survei" value={formatNumber(mine.length)} hint="Termasuk draf dan arsip" />
        <StatCard icon={<Radio aria-hidden />} label="Dipublikasikan" value={formatNumber(active.length)} hint="Menerima respons lewat tautan" />
        <StatCard icon={<Lock aria-hidden />} label="Ditutup" value={formatNumber(closed.length)} hint="Pengisian selesai, hasil siap diekspor" />
        <StatCard icon={<Inbox aria-hidden />} label="Jumlah respons" value={formatNumber(total)} hint="Dari semua survei Anda" />
      </section>

      <Card aria-labelledby="recent-title">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 id="recent-title" className="text-lg font-semibold tracking-[-0.01em]">
            Survei terbaru
          </h2>
          <Link href="/surveys" className="inline-flex min-h-9 items-center text-sm font-medium text-accent-text underline underline-offset-4 hover:no-underline">
            Lihat semua survei
          </Link>
        </div>
        {recent.length ? (
          <SurveyList surveys={recent} />
        ) : (
          <EmptyState
            title="Belum ada survei"
            body="Survei membantu Anda mengumpulkan pengalaman siswa dalam bentuk data yang bisa diekspor ke Modul 15."
            action={<NewSurveyButton />}
          />
        )}
      </Card>
    </div>
  );
}
