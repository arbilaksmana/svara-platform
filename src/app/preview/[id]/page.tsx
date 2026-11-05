"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/hooks";
import { PublicFrame } from "@/components/public-frame";
import { ClosedState, SurveyRunner } from "@/components/survey-runner";

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { surveys, user, hydrated } = useStore();
  const survey = surveys.find((s) => s.id === id && s.ownerId === user?.id);
  useDocumentTitle(`Pratinjau ${survey?.title ?? ""}`.trim());

  const banner = (
    <aside aria-label="Mode pratinjau" className="sticky top-0 z-30 bg-surface-inverse text-fg-inverse">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <Eye aria-hidden className="size-4" />
          Mode pratinjau · jawaban tidak disimpan
        </span>
        <Link
          href={survey ? `/surveys/${survey.id}/edit` : "/surveys"}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 font-medium underline underline-offset-4 hover:bg-fg-inverse/10"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Kembali ke editor
        </Link>
      </div>
    </aside>
  );

  if (!hydrated) return <PublicFrame banner={banner}><p role="status" className="text-sm text-fg-muted">Memuat pratinjau…</p></PublicFrame>;

  return (
    <PublicFrame banner={banner}>
      {!survey ? (
        <ClosedState
          title="Pratinjau tidak tersedia"
          body={<p>Masuk sebagai creator pemilik survei untuk membuka pratinjau ini.</p>}
        />
      ) : survey.questions.length === 0 ? (
        <ClosedState title="Belum ada pertanyaan untuk dipratinjau" body={<p>Tambahkan minimal satu pertanyaan di editor, lalu buka pratinjau lagi.</p>} />
      ) : (
        <SurveyRunner
          survey={survey}
          mode="preview"
          onSubmit={() => ({ ok: true, response: { id: "PRATINJAU-000", submittedAt: new Date().toISOString() }, replayed: false })}
        />
      )}
    </PublicFrame>
  );
}
