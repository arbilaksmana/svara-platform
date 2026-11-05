"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDocumentTitle } from "@/lib/hooks";
import { STATUS_LABEL, formatNumber } from "@/lib/survey";
import type { SurveyStatus } from "@/lib/types";
import { Button, Card, EmptyState, PageHeader, cx, inputClass } from "@/components/ui";
import { RequireRole } from "@/components/app-shell";
import { SurveyList } from "@/components/survey-list";
import { NewSurveyButton } from "@/components/new-survey";

type Filter = "all" | SurveyStatus;
const FILTERS: Filter[] = ["all", "draft", "published", "closed", "archived"];

export default function SurveysPage() {
  useDocumentTitle("Survei");
  return (
    <RequireRole role="creator">
      <Surveys />
    </RequireRole>
  );
}

function Surveys() {
  const { user, surveys } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const mine = useMemo(
    () => surveys.filter((s) => s.ownerId === user?.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [surveys, user],
  );
  const q = query.trim().toLowerCase();
  const visible = mine.filter(
    (s) =>
      (filter === "all" || s.status === filter) &&
      (!q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q)),
  );
  const count = (f: Filter) => (f === "all" ? mine.length : mine.filter((s) => s.status === f).length);

  return (
    <div className="space-y-6">
      <PageHeader title="Survei" description="Semua survei milik Anda, dari draf sampai arsip." actions={<NewSurveyButton />} />

      <Card>
        <div className="flex flex-col gap-4 border-b border-line p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <label htmlFor="search" className="block text-sm font-medium">
              Cari survei
            </label>
            <div className="relative mt-1.5">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-fg-muted" />
              <input
                id="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Judul, kode, atau topik"
                className={cx(inputClass, "ps-9")}
              />
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Status</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <label
                  key={f}
                  className={cx(
                    "press inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                    filter === f ? "border-accent bg-accent-soft text-accent-text" : "border-line-input text-fg hover:bg-surface-muted",
                  )}
                >
                  <input type="radio" name="status" value={f} checked={filter === f} onChange={() => setFilter(f)} className="sr-only" />
                  {f === "all" ? "Semua" : STATUS_LABEL[f]}
                  <span className="text-fg-muted tabular-nums">{formatNumber(count(f))}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <p role="status" className="sr-only">
          {`${formatNumber(visible.length)} survei ditampilkan`}
        </p>

        {visible.length ? (
          <SurveyList surveys={visible} />
        ) : mine.length ? (
          <EmptyState
            title={q ? `Tidak ada survei yang cocok dengan “${query.trim()}”` : `Belum ada survei berstatus ${STATUS_LABEL[filter as SurveyStatus]}`}
            body="Ubah kata kunci atau tampilkan semua status."
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Hapus filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Belum ada survei"
            body="Buat survei pertama Anda dari kosong atau dari template adopsi teknologi dan technostress."
            action={<NewSurveyButton />}
          />
        )}
      </Card>
    </div>
  );
}
