import type { Question, Survey, SurveyResponse, SurveyStatus } from "./types";

const TZ = "Asia/Jakarta";

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const numberFmt = new Intl.NumberFormat("id-ID");
const pctFmt = new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 0 });

/** Server time is stored in UTC; people read it in WIB (SRS §11.1). */
export const formatDateTime = (iso: string) => `${dateTimeFmt.format(new Date(iso))} WIB`;
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatTime = (iso: string) => `${timeFmt.format(new Date(iso))} WIB`;
export const formatNumber = (n: number) => numberFmt.format(n);
export const formatPercent = (ratio: number) => pctFmt.format(ratio);

export const STATUS_LABEL: Record<SurveyStatus, string> = {
  draft: "Draf",
  published: "Dipublikasikan",
  closed: "Ditutup",
  archived: "Diarsipkan",
};

export const QUESTION_TYPE_LABEL: Record<Question["type"], string> = {
  likert: "Skala Likert",
  short: "Jawaban singkat",
  single: "Pilihan tunggal",
};

/* ---------- Scoring (SRS §10.2) ---------- */

export interface Distribution {
  question: Question;
  answered: number;
  rows: { key: string; label: string; value: number | null; count: number }[];
}

export function distributionFor(question: Question, responses: SurveyResponse[]): Distribution {
  const answered = responses.filter((r) => {
    const v = r.answers[question.code];
    return v !== null && v !== undefined && v !== "";
  }).length;

  if (question.type === "likert" && question.scale) {
    const rows = [];
    for (let v = question.scale.min; v <= question.scale.max; v++) {
      rows.push({
        key: String(v),
        label: question.scale.labels[v] ?? "",
        value: v,
        count: responses.filter((r) => r.answers[question.code] === v).length,
      });
    }
    return { question, answered, rows };
  }

  if (question.type === "single" && question.options) {
    return {
      question,
      answered,
      rows: question.options.map((o) => ({
        key: o.id,
        label: o.label,
        value: null,
        count: responses.filter((r) => r.answers[question.code] === o.id).length,
      })),
    };
  }

  return { question, answered, rows: [] };
}

/* ---------- Validation before publish (F-09) ---------- */

export interface Issue {
  fieldId: string;
  message: string;
}

export const CODE_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

export function validateSurvey(survey: Survey): Issue[] {
  const issues: Issue[] = [];
  if (!survey.title.trim()) {
    issues.push({ fieldId: "survey-title", message: "Tulis judul survei." });
  }
  if (survey.questions.length === 0) {
    issues.push({ fieldId: "add-question", message: "Tambahkan minimal satu pertanyaan." });
  }
  const seen = new Map<string, number>();
  for (const q of survey.questions) seen.set(q.code, (seen.get(q.code) ?? 0) + 1);

  for (const q of survey.questions) {
    const label = q.code || "Pertanyaan tanpa kode";
    if (!CODE_PATTERN.test(q.code)) {
      issues.push({
        fieldId: `${q.id}-code`,
        message: `${label}: gunakan 2–10 huruf kapital atau angka, diawali huruf, misalnya AD01.`,
      });
    } else if ((seen.get(q.code) ?? 0) > 1) {
      issues.push({ fieldId: `${q.id}-code`, message: `${label}: kode dipakai lebih dari sekali. Beri kode yang berbeda.` });
    }
    if (!q.text.trim()) {
      issues.push({ fieldId: `${q.id}-text`, message: `${label}: tulis teks pertanyaan.` });
    }
    if (q.type === "likert" && q.scale && q.scale.max <= q.scale.min) {
      issues.push({ fieldId: `${q.id}-max`, message: `${label}: nilai maksimum harus lebih besar dari nilai minimum.` });
    }
    if (q.type === "single" && (q.options?.filter((o) => o.label.trim()).length ?? 0) < 2) {
      issues.push({ fieldId: `${q.id}-options`, message: `${label}: isi minimal dua pilihan jawaban.` });
    }
  }
  return issues;
}

/* ---------- Export (Lampiran B) ---------- */

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]): string {
  // BOM so Excel opens UTF-8 names and labels correctly.
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export function exportLong(survey: Survey, responses: SurveyResponse[], includeNames: boolean): string {
  const header = [
    "survey_id",
    "survey_version",
    "respondent_id",
    ...(includeNames ? ["respondent_name"] : []),
    "class_name",
    "source",
    "question_code",
    "answer_value",
    "answer_text",
    "submitted_at",
    "consent_version",
  ];
  const rows: unknown[][] = [header];
  for (const r of responses) {
    for (const q of survey.questions) {
      const a = r.answers[q.code];
      if (a === undefined) continue;
      const option = q.type === "single" ? q.options?.find((o) => o.id === a) : undefined;
      rows.push([
        survey.code,
        r.versionNo,
        r.respondent.id,
        ...(includeNames ? [r.respondent.name] : []),
        r.respondent.className,
        r.respondent.source,
        q.code,
        typeof a === "number" ? a : null,
        typeof a === "string" ? (option?.label ?? a) : null,
        r.submittedAt,
        r.consentVersion,
      ]);
    }
  }
  return toCsv(rows);
}

export function exportCodebook(survey: Survey): string {
  const rows: unknown[][] = [
    ["survey_id", "survey_version", "question_code", "group_code", "dimension_code", "type", "required", "reversed", "question_text", "value", "value_label"],
  ];
  for (const q of survey.questions) {
    const base = [survey.code, survey.version, q.code, q.groupCode, q.dimensionCode, q.type, q.required, Boolean(q.reversed), q.text];
    if (q.type === "likert" && q.scale) {
      for (let v = q.scale.min; v <= q.scale.max; v++) rows.push([...base, v, q.scale.labels[v] ?? ""]);
    } else if (q.type === "single" && q.options) {
      for (const o of q.options) rows.push([...base, "", o.label]);
    } else {
      rows.push([...base, "", ""]);
    }
  }
  return toCsv(rows);
}

export function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function uid(prefix: string) {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${s}`;
}
