"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, Link2Off, PlugZap, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/hooks";
import type { Respondent } from "@/lib/types";
import { Button, Notice } from "@/components/ui";
import { PublicFrame } from "@/components/public-frame";
import { ClosedState, SurveyRunner } from "@/components/survey-runner";

/** Stand-in for GET /api/v1/integration/students/{studentId} (Modul 13). */
const MOCK_STUDENTS: Record<string, Respondent> = {
  "STD-2041": { id: "STD-2041", name: "Nadia Putri", className: "XI RPL 1", major: "Rekayasa Perangkat Lunak (RPL)", source: "integrated_module_13" },
};

export default function PublicSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return (
    <PublicFrame>
      <Suspense fallback={<p className="text-sm text-fg-muted">Memuat survei…</p>}>
        <PublicSurvey token={token} />
      </Suspense>
    </PublicFrame>
  );
}

function PublicSurvey({ token }: { token: string }) {
  const { surveys, hydrated, submitResponse, users } = useStore();
  const params = useSearchParams();
  const sso = params.get("sso");
  const survey = surveys.find((s) => s.token === token);
  useDocumentTitle(survey?.title ?? "Survei");
  const [receipt, setReceipt] = useState<{ id: string; submittedAt: string } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`svara-receipt-${token}`);
      if (raw) setReceipt(JSON.parse(raw));
    } catch {}
    setChecked(true);
  }, [token]);

  if (!hydrated || !checked) return <p className="text-sm text-fg-muted" role="status">Memuat survei…</p>;

  if (!survey) {
    return (
      <ClosedState
        icon={<Link2Off aria-hidden className="size-8" />}
        title="Tautan survei tidak ditemukan"
        body={<p>Periksa kembali tautan dari guru Anda. Pastikan tidak ada huruf yang terpotong saat disalin.</p>}
      />
    );
  }

  const owner = users.find((u) => u.id === survey.ownerId)?.name ?? "guru pembuat survei";

  if (receipt) {
    return <SurveyRunner survey={survey} mode="live" initialReceipt={receipt} onSubmit={() => ({ ok: false, message: "" })} />;
  }

  if (survey.status === "draft") {
    return (
      <ClosedState
        icon={<CalendarClock aria-hidden className="size-8" />}
        title="Survei belum dibuka"
        body={<p>{owner} belum membuka survei ini untuk diisi. Coba buka tautan yang sama lagi nanti.</p>}
      />
    );
  }

  if (survey.status !== "published") {
    return (
      <ClosedState
        title="Survei sudah ditutup"
        body={<p>Survei “{survey.title}” tidak lagi menerima jawaban. Jika Anda belum sempat mengisi, hubungi {owner}.</p>}
      />
    );
  }

  const integratedStudent = sso && survey.allowIntegrated ? MOCK_STUDENTS[sso] : undefined;
  const integrationFailed = Boolean(sso) && survey.allowIntegrated && !integratedStudent;

  if (!integratedStudent && !survey.allowStandalone) {
    return (
      <ClosedState
        icon={<PlugZap aria-hidden className="size-8" />}
        title={integrationFailed ? "Akun sekolah sedang tidak bisa dihubungi" : "Masuk lewat akun sekolah untuk mengisi"}
        body={
          <>
            <p>
              {integrationFailed
                ? "Layanan akun sekolah (Modul 13) tidak merespons, jadi identitas Anda belum bisa diambil. Jawaban belum ada yang tersimpan. Coba lagi dalam beberapa menit."
                : "Survei ini hanya bisa diisi oleh siswa yang membukanya dari portal sekolah. Buka portal, lalu pilih survei ini dari daftar tugas Anda."}
            </p>
            {integrationFailed && (
              <Button className="mt-4" onClick={() => window.location.reload()}>
                <RefreshCw aria-hidden className="size-4" />
                Coba lagi
              </Button>
            )}
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {integrationFailed && (
        <Notice tone="warning" icon={<PlugZap aria-hidden />} title="Akun sekolah sedang tidak bisa dihubungi">
          Anda tetap bisa mengisi survei dengan menuliskan identitas sendiri. Jawaban dicatat sebagai pengisian mandiri.
        </Notice>
      )}
      <SurveyRunner
        survey={survey}
        mode="live"
        integratedIdentity={integratedStudent ?? null}
        onSubmit={(p) => {
          const out = submitResponse(token, {
            respondent: p.respondent,
            answers: p.answers,
            idempotencyKey: p.idempotencyKey,
            consentVersion: survey.consentVersion,
            consentedAt: p.consentedAt,
          });
          if (out.ok) {
            const r = { id: out.response.id, submittedAt: out.response.submittedAt };
            localStorage.setItem(`svara-receipt-${token}`, JSON.stringify(r));
            return { ok: true, response: r, replayed: out.replayed };
          }
          return {
            ok: false,
            message:
              out.reason === "not_open"
                ? "Survei baru saja ditutup, jadi jawaban tidak bisa dikirim. Hubungi guru Anda jika perlu mengisi."
                : out.reason === "conflict"
                  ? "Jawaban ini bentrok dengan pengiriman sebelumnya. Muat ulang halaman, lalu isi kembali."
                  : "Survei tidak ditemukan. Periksa kembali tautan dari guru Anda.",
          };
        }}
      />
    </div>
  );
}
