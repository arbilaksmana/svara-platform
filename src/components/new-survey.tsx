"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, LayoutTemplate, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Dialog } from "./ui";

/** Start blank or copy the case-study template (SRS §7.1 step 2). */
export function NewSurveyButton() {
  const [open, setOpen] = useState(false);
  const { createSurvey, duplicate } = useStore();
  const router = useRouter();

  const choice =
    "press flex w-full items-start gap-3 rounded-xl border border-line-input p-4 text-start hover:bg-surface-muted";

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" />
        Buat survei
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Buat survei baru" description="Pilih titik awal. Anda bisa mengubah semuanya sebelum survei dipublikasikan.">
        <div className="space-y-3">
          <button
            type="button"
            className={choice}
            onClick={() => {
              const s = createSurvey();
              setOpen(false);
              router.push(`/surveys/${s.id}/edit`);
            }}
          >
            <FilePlus2 aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-text" />
            <span>
              <span className="block font-medium">Mulai dari kosong</span>
              <span className="mt-0.5 block text-sm text-fg-muted">Satu bagian kosong, tambahkan pertanyaan sendiri.</span>
            </span>
          </button>
          <button
            type="button"
            className={choice}
            onClick={() => {
              const s = duplicate("surv-001");
              setOpen(false);
              if (s) router.push(`/surveys/${s.id}/edit`);
            }}
          >
            <LayoutTemplate aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-text" />
            <span>
              <span className="block font-medium">Salin template adopsi teknologi dan technostress</span>
              <span className="mt-0.5 block text-sm text-fg-muted">8 pertanyaan contoh dari Lampiran A: AD01–AD03, TS01–TS03, K01, K02.</span>
            </span>
          </button>
        </div>
      </Dialog>
    </>
  );
}
