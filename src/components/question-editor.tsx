"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import type { LikertScale, Question, QuestionType, Section } from "@/lib/types";
import { CODE_PATTERN, QUESTION_TYPE_LABEL, uid } from "@/lib/survey";
import { Button, Field, Tag, cx, describedBy, inputClass } from "./ui";

const PRESETS = [4, 5, 6, 8, 10];

export function defaultScale(max = 5): LikertScale {
  return { min: 1, max, labels: {} };
}

export function codeError(q: Question, all: Question[]) {
  if (!q.code) return "Isi kode pertanyaan, misalnya AD01.";
  if (!CODE_PATTERN.test(q.code)) return "Gunakan 2–10 huruf kapital atau angka, diawali huruf.";
  if (all.some((o) => o.id !== q.id && o.code === q.code)) return "Kode ini sudah dipakai pertanyaan lain.";
  return undefined;
}

export function QuestionCard({
  q,
  index,
  all,
  sections,
  expanded,
  onToggle,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
  canMoveUp,
  canMoveDown,
  readOnly,
}: {
  q: Question;
  index: number;
  all: Question[];
  sections: Section[];
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Question>) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  readOnly: boolean;
}) {
  const panelId = useId();
  const codeErr = codeError(q, all);
  const textErr = !q.text.trim() ? "Tulis teks pertanyaan." : undefined;
  const hasProblem = Boolean(codeErr || textErr);
  const name = q.code || `pertanyaan ${index + 1}`;

  function setType(type: QuestionType) {
    onChange({
      type,
      scale: type === "likert" ? (q.scale ?? defaultScale()) : undefined,
      options:
        type === "single"
          ? (q.options ?? [
              { id: uid("opt"), label: "Ya" },
              { id: uid("opt"), label: "Tidak" },
            ])
          : undefined,
    });
  }

  function setRange(min: number, max: number) {
    const labels: Record<number, string> = {};
    for (let v = min; v <= max; v++) if (q.scale?.labels[v]) labels[v] = q.scale.labels[v];
    onChange({ scale: { min, max, labels } });
  }

  return (
    <li className={cx("rounded-xl border bg-surface", hasProblem ? "border-danger-line" : "border-line")}>
      <div className="flex items-start gap-3 p-4">
        <span className="mt-0.5 w-6 shrink-0 text-end text-sm font-medium text-fg-muted tabular-nums">{index + 1}.</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{q.code || "Tanpa kode"}</Tag>
            <span className="text-sm text-fg-muted">
              {QUESTION_TYPE_LABEL[q.type]}
              {q.type === "likert" && q.scale && ` ${q.scale.min}–${q.scale.max}`} · {q.required ? "Wajib" : "Opsional"}
            </span>
            {hasProblem && <span className="text-sm font-medium text-danger-text">Perlu dilengkapi</span>}
          </div>
          <p className={cx("mt-1.5 break-words", !q.text && "text-fg-muted italic")}>{q.text || "Teks pertanyaan belum diisi"}</p>
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-1">
            <IconButton label={`Pindahkan ${name} ke atas`} disabled={!canMoveUp} onClick={() => onMove(-1)}>
              <ArrowUp aria-hidden className="size-4" />
            </IconButton>
            <IconButton label={`Pindahkan ${name} ke bawah`} disabled={!canMoveDown} onClick={() => onMove(1)}>
              <ArrowDown aria-hidden className="size-4" />
            </IconButton>
          </div>
        )}
      </div>

      <div className="border-t border-line px-4 py-2">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
          className="press inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-accent-text hover:bg-accent-soft"
        >
          <ChevronDown aria-hidden className={cx("size-4 transition-[rotate] duration-150 motion-reduce:transition-none", expanded && "rotate-180")} />
          {readOnly ? (expanded ? "Sembunyikan detail" : "Lihat detail") : expanded ? "Tutup pengaturan" : "Atur pertanyaan"}
          <span className="sr-only"> {name}</span>
        </button>
      </div>

      <div id={panelId} hidden={!expanded} className="border-t border-line p-4 sm:p-5">
        <fieldset disabled={readOnly} className="space-y-5">
          <legend className="sr-only">Pengaturan {name}</legend>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,1fr)]">
            <Field id={`${q.id}-code`} label="Kode" hint="Contoh: AD01" error={codeErr}>
              <input
                id={`${q.id}-code`}
                value={q.code}
                onChange={(e) => onChange({ code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                aria-invalid={codeErr ? true : undefined}
                aria-describedby={describedBy(`${q.id}-code`, true, codeErr)}
                autoComplete="off"
                spellCheck={false}
                className={cx(inputClass, "font-mono uppercase")}
              />
            </Field>
            <Field id={`${q.id}-type`} label="Tipe jawaban">
              <select id={`${q.id}-type`} value={q.type} onChange={(e) => setType(e.target.value as QuestionType)} className={inputClass}>
                <option value="likert">{QUESTION_TYPE_LABEL.likert}</option>
                <option value="short">{QUESTION_TYPE_LABEL.short}</option>
                <option value="single">{QUESTION_TYPE_LABEL.single}</option>
              </select>
            </Field>
            <Field id={`${q.id}-section`} label="Bagian">
              <select id={`${q.id}-section`} value={q.sectionId} onChange={(e) => onChange({ sectionId: e.target.value })} className={inputClass}>
                {sections.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    {s.title || `Bagian ${i + 1}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field id={`${q.id}-text`} label="Teks pertanyaan" error={textErr}>
            <textarea
              id={`${q.id}-text`}
              rows={2}
              value={q.text}
              onChange={(e) => onChange({ text: e.target.value })}
              aria-invalid={textErr ? true : undefined}
              aria-describedby={describedBy(`${q.id}-text`, false, textErr)}
              className={inputClass}
            />
          </Field>

          <Field id={`${q.id}-help`} label="Petunjuk untuk responden" optional>
            <input id={`${q.id}-help`} value={q.help} onChange={(e) => onChange({ help: e.target.value })} className={inputClass} />
          </Field>

          <label className="flex min-h-10 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={q.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="size-5 shrink-0 accent-accent"
            />
            <span className="text-sm font-medium">Wajib dijawab</span>
          </label>

          {q.type === "likert" && q.scale && (
            <fieldset className="space-y-4 rounded-lg bg-surface-muted p-4">
              <legend className="float-left w-full text-sm font-semibold">Skala dan nilai skor</legend>
              <div className="clear-both flex flex-wrap items-end gap-4">
                <div>
                  <p id={`${q.id}-preset`} className="text-sm font-medium">
                    Rentang cepat
                  </p>
                  <div role="group" aria-labelledby={`${q.id}-preset`} className="mt-1.5 flex flex-wrap gap-2">
                    {PRESETS.map((max) => {
                      const on = q.scale?.min === 1 && q.scale?.max === max;
                      return (
                        <button
                          key={max}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setRange(1, max)}
                          className={cx(
                            "press min-h-9 rounded-lg border px-3 text-sm font-medium tabular-nums",
                            on ? "border-accent bg-accent text-fg-inverse" : "border-line-input bg-surface hover:bg-canvas",
                          )}
                        >
                          1–{max}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field id={`${q.id}-min`} label="Nilai minimum">
                  <select
                    id={`${q.id}-min`}
                    value={q.scale.min}
                    onChange={(e) => setRange(Number(e.target.value), q.scale!.max)}
                    className={cx(inputClass, "w-24")}
                  >
                    {[0, 1].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field id={`${q.id}-max`} label="Nilai maksimum">
                  <select
                    id={`${q.id}-max`}
                    value={q.scale.max}
                    onChange={(e) => setRange(q.scale!.min, Number(e.target.value))}
                    className={cx(inputClass, "w-24")}
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div>
                <p className="text-sm font-medium">Label per nilai</p>
                <p className="mt-0.5 text-sm text-fg-muted">
                  Skor yang disimpan adalah angkanya, bukan labelnya. Isi minimal label ujung agar siswa paham arti angka.
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: q.scale.max - q.scale.min + 1 }, (_, i) => q.scale!.min + i).map((v) => (
                    <li key={v} className="flex items-center gap-2">
                      <label htmlFor={`${q.id}-label-${v}`} className="w-14 shrink-0 text-sm text-fg-muted">
                        Nilai <span className="font-semibold text-fg tabular-nums">{v}</span>
                      </label>
                      <input
                        id={`${q.id}-label-${v}`}
                        value={q.scale!.labels[v] ?? ""}
                        placeholder={v === q.scale!.min ? "Sangat tidak setuju" : v === q.scale!.max ? "Sangat setuju" : ""}
                        onChange={(e) => onChange({ scale: { ...q.scale!, labels: { ...q.scale!.labels, [v]: e.target.value } } })}
                        className={inputClass}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(q.reversed)}
                  onChange={(e) => onChange({ reversed: e.target.checked })}
                  className="mt-0.5 size-5 shrink-0 accent-accent"
                />
                <span className="text-sm">
                  <span className="font-medium">Item terbalik</span>
                  <span className="block text-fg-muted">Dicatat di kodebook untuk Modul 15. Skor mentah tetap disimpan apa adanya.</span>
                </span>
              </label>
            </fieldset>
          )}

          {q.type === "single" && (
            <fieldset id={`${q.id}-options`} tabIndex={-1} className="space-y-3 rounded-lg bg-surface-muted p-4 outline-none">
              <legend className="float-left w-full text-sm font-semibold">Pilihan jawaban (tanpa skor)</legend>
              <ul className="clear-both space-y-2">
                {(q.options ?? []).map((o, i) => (
                  <li key={o.id} className="flex items-center gap-2">
                    <label htmlFor={o.id} className="sr-only">
                      Pilihan {i + 1}
                    </label>
                    <input
                      id={o.id}
                      value={o.label}
                      onChange={(e) => onChange({ options: q.options!.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })}
                      className={inputClass}
                    />
                    <IconButton
                      label={`Hapus pilihan ${o.label || i + 1}`}
                      disabled={(q.options?.length ?? 0) <= 2}
                      onClick={() => onChange({ options: q.options!.filter((x) => x.id !== o.id) })}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
              <Button size="sm" onClick={() => onChange({ options: [...(q.options ?? []), { id: uid("opt"), label: "" }] })}>
                <Plus aria-hidden className="size-4" />
                Tambah pilihan
              </Button>
            </fieldset>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={`${q.id}-group`} label="Kode kelompok" optional hint="Metadata untuk Modul 15, misalnya ADOPSI.">
              <input
                id={`${q.id}-group`}
                value={q.groupCode}
                aria-describedby={`${q.id}-group-hint`}
                onChange={(e) => onChange({ groupCode: e.target.value.toUpperCase() })}
                className={cx(inputClass, "font-mono")}
              />
            </Field>
            <Field id={`${q.id}-dim`} label="Kode dimensi" optional hint="Tidak dihitung menjadi indeks pada MVP.">
              <input
                id={`${q.id}-dim`}
                value={q.dimensionCode}
                aria-describedby={`${q.id}-dim-hint`}
                onChange={(e) => onChange({ dimensionCode: e.target.value.toUpperCase() })}
                className={cx(inputClass, "font-mono")}
              />
            </Field>
          </div>
        </fieldset>

        {!readOnly && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-4">
            <Button size="sm" onClick={onDuplicate}>
              <Copy aria-hidden className="size-4" />
              Duplikat pertanyaan
            </Button>
            <Button size="sm" variant="ghost" className="text-danger-text hover:bg-danger-soft" onClick={onDelete}>
              <Trash2 aria-hidden className="size-4" />
              Hapus pertanyaan
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

export function IconButton({
  label,
  children,
  ...rest
}: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="press inline-flex size-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
      {...rest}
    >
      {children}
    </button>
  );
}
