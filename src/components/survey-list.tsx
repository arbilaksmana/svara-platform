"use client";

import Link from "next/link";
import { Archive, BarChart3, Eye, Link2, Pencil, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDate, formatNumber } from "@/lib/survey";
import type { Survey } from "@/lib/types";
import { Button, ButtonLink, StatusBadge, Tag } from "./ui";
import { useToast } from "./toast";

export function publicUrl(token: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/s/${token}`;
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function SurveyList({ surveys, showOwner = false }: { surveys: Survey[]; showOwner?: boolean }) {
  const { responses, users } = useStore();
  const countFor = (id: string) => responses.filter((r) => r.surveyId === id).length;

  return (
    <div>
      <div
        aria-hidden
        className="hidden grid-cols-[minmax(0,1fr)_9rem_5rem_6.5rem_15rem] gap-4 border-b border-line px-5 py-2.5 text-xs font-medium tracking-[0.05em] text-fg-muted uppercase md:grid"
      >
        <span>Survei</span>
        <span>Status</span>
        <span className="text-end">Respons</span>
        <span>Diperbarui</span>
        <span className="text-end">Tindakan</span>
      </div>
      <ul className="divide-y divide-line">
        {surveys.map((s) => (
          <li
            key={s.id}
            className="grid gap-x-4 gap-y-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_9rem_5rem_6.5rem_15rem] md:items-center"
          >
            <div className="min-w-0">
              <Link
                href={s.status === "draft" ? `/surveys/${s.id}/edit` : `/surveys/${s.id}/results`}
                className="font-medium text-fg underline-offset-4 hover:underline"
              >
                {s.title || "Survei tanpa judul"}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
                <Tag>{s.code}</Tag>
                <span>Versi {s.version}</span>
                {showOwner && <span>· {users.find((u) => u.id === s.ownerId)?.name}</span>}
              </div>
            </div>
            <dl className="contents">
              <div className="flex items-center gap-2 md:block">
                <dt className="text-sm text-fg-muted md:sr-only">Status</dt>
                <dd>
                  <StatusBadge status={s.status} />
                </dd>
              </div>
              <div className="flex items-center gap-2 md:block md:text-end">
                <dt className="text-sm text-fg-muted md:sr-only">Respons</dt>
                <dd className="text-sm font-medium tabular-nums">{formatNumber(countFor(s.id))}</dd>
              </div>
              <div className="flex items-center gap-2 md:block">
                <dt className="text-sm text-fg-muted md:sr-only">Diperbarui</dt>
                <dd className="text-sm text-fg-muted tabular-nums">{formatDate(s.updatedAt)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <RowActions survey={s} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowActions({ survey: s }: { survey: Survey }) {
  const { setStatus } = useStore();
  const toast = useToast();
  const name = s.title || s.code;

  if (s.status === "draft") {
    return (
      <>
        <ButtonLink size="sm" href={`/preview/${s.id}`} aria-label={`Pratinjau ${name}`}>
          <Eye aria-hidden className="size-4" />
          Pratinjau
        </ButtonLink>
        <ButtonLink size="sm" href={`/surveys/${s.id}/edit`} aria-label={`Edit ${name}`}>
          <Pencil aria-hidden className="size-4" />
          Edit
        </ButtonLink>
      </>
    );
  }

  const results = (
    <ButtonLink size="sm" href={`/surveys/${s.id}/results`} aria-label={`Hasil ${name}`}>
      <BarChart3 aria-hidden className="size-4" />
      Hasil
    </ButtonLink>
  );

  if (s.status === "published") {
    return (
      <>
        <Button
          size="sm"
          aria-label={`Salin tautan ${name}`}
          onClick={async () => {
            const ok = await copyText(publicUrl(s.token));
            toast({ message: ok ? "Tautan survei disalin." : `Tidak bisa menyalin otomatis. Salin manual: ${publicUrl(s.token)}` });
          }}
        >
          <Link2 aria-hidden className="size-4" />
          Salin tautan
        </Button>
        {results}
      </>
    );
  }

  if (s.status === "closed") {
    return (
      <>
        <Button
          size="sm"
          aria-label={`Arsipkan ${name}`}
          onClick={() => {
            setStatus(s.id, "archived");
            toast({ message: `${name} diarsipkan.`, action: { label: "Urungkan", onClick: () => setStatus(s.id, "closed") } });
          }}
        >
          <Archive aria-hidden className="size-4" />
          Arsipkan
        </Button>
        {results}
      </>
    );
  }

  return (
    <>
      <Button
        size="sm"
        aria-label={`Pulihkan ${name}`}
        onClick={() => {
          setStatus(s.id, "closed");
          toast({ message: `${name} dipulihkan ke status Ditutup.` });
        }}
      >
        <RotateCcw aria-hidden className="size-4" />
        Pulihkan
      </Button>
      {results}
    </>
  );
}
