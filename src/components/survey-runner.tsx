"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lock, Send, ShieldCheck, UserRound } from "lucide-react";
import type { AnswerValue, Question, Respondent, Survey, SurveyResponse } from "@/lib/types";
import { formatDateTime, formatNumber, uid } from "@/lib/survey";
import { Button, Field, Notice, cx, describedBy, inputClass } from "./ui";

type Step = { kind: "intro" } | { kind: "identity" } | { kind: "section"; index: number } | { kind: "review" } | { kind: "done" };

export type SubmitOutcome =
  | { ok: true; response: Pick<SurveyResponse, "id" | "submittedAt">; replayed: boolean }
  | { ok: false; message: string };

const MAJORS = ["Rekayasa Perangkat Lunak (RPL)", "Teknik Komputer dan Jaringan (TKJ)", "Desain Komunikasi Visual (DKV)", "Akuntansi dan Keuangan Lembaga (AKL)", "Lainnya"];

export function SurveyRunner({
  survey,
  mode,
  integratedIdentity,
  onSubmit,
  initialReceipt,
}: {
  survey: Survey;
  mode: "preview" | "live";
  integratedIdentity?: Respondent | null;
  onSubmit: (payload: { respondent: Respondent; answers: Record<string, AnswerValue>; idempotencyKey: string; consentedAt: string }) => SubmitOutcome;
  initialReceipt?: { id: string; submittedAt: string } | null;
}) {
  const sections = survey.sections.filter((s) => survey.questions.some((q) => q.sectionId === s.id));
  const steps: Step[] = [
    { kind: "intro" },
    ...(integratedIdentity ? [] : [{ kind: "identity" } as Step]),
    ...sections.map((_, index) => ({ kind: "section", index }) as Step),
    { kind: "review" },
  ];
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState<{ id: string; submittedAt: string; replayed: boolean } | null>(
    initialReceipt ? { ...initialReceipt, replayed: true } : null,
  );
  const step: Step = done ? { kind: "done" } : steps[stepIndex];

  const [consent, setConsent] = useState(false);
  const [consentedAt, setConsentedAt] = useState("");
  const [identity, setIdentity] = useState({ name: "", className: "", major: "" });
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [sending, setSending] = useState(false);
  const [key] = useState(() => uid("idem"));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [stepIndex, done]);

  const progressSteps = steps.length;
  const go = (i: number) => {
    setErrors({});
    setStepIndex(i);
  };

  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0];
    if (first) setTimeout(() => document.getElementById(first)?.focus(), 0);
  }

  function next() {
    const errs: Record<string, string> = {};
    if (step.kind === "intro" && !consent) {
      errs["consent"] = "Centang persetujuan untuk mulai mengisi. Jika tidak setuju, Anda boleh menutup halaman ini.";
    }
    if (step.kind === "identity") {
      if (!identity.name.trim()) errs["id-name"] = "Tulis nama lengkap Anda.";
      if (!identity.className.trim()) errs["id-class"] = "Tulis kelas Anda, misalnya XI RPL 1.";
      if (!identity.major) errs["id-major"] = "Pilih jurusan Anda.";
    }
    if (step.kind === "section") {
      for (const q of questionsOf(sections[step.index].id)) {
        const v = answers[q.code];
        if (q.required && (v === undefined || v === null || v === "")) {
          errs[firstControlId(q)] = q.type === "short" ? "Tulis jawaban Anda untuk pertanyaan ini." : "Pilih salah satu jawaban untuk pertanyaan ini.";
        }
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirstError(errs);
    if (step.kind === "intro") setConsentedAt(new Date().toISOString());
    go(stepIndex + 1);
  }

  function questionsOf(sectionId: string) {
    return survey.questions.filter((q) => q.sectionId === sectionId);
  }

  function submit() {
    if (sending) return;
    const missing = survey.questions.filter((q) => q.required && (answers[q.code] === undefined || answers[q.code] === ""));
    if (missing.length) {
      setSubmitError(`${formatNumber(missing.length)} pertanyaan wajib belum dijawab. Pilih “Ubah” pada bagiannya untuk melengkapi.`);
      return;
    }
    setSending(true);
    setSubmitError("");
    const respondent: Respondent = integratedIdentity ?? {
      id: `LOC-${uid("R")}`,
      name: identity.name.trim(),
      className: identity.className.trim(),
      major: identity.major,
      source: "standalone",
    };
    const filled: Record<string, AnswerValue> = {};
    for (const q of survey.questions) filled[q.code] = answers[q.code] ?? null;
    // Short delay stands in for the network round trip.
    setTimeout(() => {
      const out = onSubmit({ respondent, answers: filled, idempotencyKey: key, consentedAt: consentedAt || new Date().toISOString() });
      setSending(false);
      if (out.ok) setDone({ ...out.response, replayed: out.replayed });
      else setSubmitError(out.message);
    }, 600);
  }

  const stepLabel = (s: Step) =>
    s.kind === "intro" ? "Pengantar" : s.kind === "identity" ? "Identitas" : s.kind === "section" ? sections[s.index].title : s.kind === "review" ? "Tinjau jawaban" : "Selesai";

  /* ---------- Render ---------- */

  if (step.kind === "done" && done) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <CheckCircle2 aria-hidden className="size-10 text-success-text" />
        <h1 ref={headingRef} tabIndex={-1} id="page-title" className="mt-4 text-2xl font-semibold tracking-[-0.015em] outline-none">
          {mode === "preview" ? "Pratinjau selesai" : done.replayed ? "Jawaban Anda sudah terkirim" : "Terima kasih, jawaban terkirim"}
        </h1>
        <p className="mt-2 text-fg-muted">
          {mode === "preview"
            ? "Ini tampilan bukti pengiriman yang dilihat siswa. Tidak ada data yang disimpan."
            : "Simpan bukti di bawah ini. Jawaban sudah dikunci dan tidak bisa diubah."}
        </p>
        <dl className="mt-6 grid gap-4 rounded-xl bg-surface-muted p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-fg-muted">Nomor bukti</dt>
            <dd className="mt-0.5 font-mono font-semibold break-all">{done.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-fg-muted">Waktu terkirim</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatDateTime(done.submittedAt)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-fg-muted">Survei</dt>
            <dd className="mt-0.5 font-semibold">
              {survey.title} · versi {survey.version}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-fg-muted">
          Skor survei ini dipakai untuk pembinaan, bukan nilai rapor, kelulusan, atau diagnosis. Anda boleh menutup halaman ini.
        </p>
      </div>
    );
  }

  const current = stepIndex + 1;

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{stepLabel(step)}</span>
          <span className="text-fg-muted tabular-nums">
            Langkah {formatNumber(current)} dari {formatNumber(progressSteps)}
          </span>
        </div>
        <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-accent" style={{ width: `${(current / progressSteps) * 100}%` }} />
        </div>
      </div>

      <div className="px-5 py-6 sm:px-8 sm:py-8">
        {step.kind === "intro" && (
          <div className="space-y-6">
            <div>
              <h1 ref={headingRef} tabIndex={-1} id="page-title" className="text-2xl font-semibold tracking-[-0.015em] outline-none">
                {survey.title}
              </h1>
              {survey.description && <p className="mt-2 text-fg-muted">{survey.description}</p>}
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg-muted">
                <Clock aria-hidden className="size-4" />
                {formatNumber(survey.questions.length)} pertanyaan · sekitar {formatNumber(Math.max(2, Math.ceil(survey.questions.length / 3)))} menit
              </p>
            </div>
            {survey.purpose && (
              <div>
                <h2 className="font-semibold">Tujuan survei</h2>
                <p className="mt-1 text-fg-muted">{survey.purpose}</p>
              </div>
            )}
            {survey.instructions && (
              <div>
                <h2 className="font-semibold">Cara mengisi</h2>
                <p className="mt-1 text-fg-muted">{survey.instructions}</p>
              </div>
            )}

            {integratedIdentity && (
              <Notice tone="info" icon={<UserRound aria-hidden />} title="Identitas diambil dari akun sekolah (Modul 13)">
                <p>
                  {integratedIdentity.name} · {integratedIdentity.className} · {integratedIdentity.major}. Anda tidak perlu mengisi identitas lagi.
                </p>
              </Notice>
            )}

            <section aria-labelledby="privacy-title" className="rounded-xl border border-line bg-canvas p-5">
              <h2 id="privacy-title" className="flex items-center gap-2 font-semibold">
                <ShieldCheck aria-hidden className="size-5 text-accent-text" />
                Pemberitahuan privasi
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm text-fg-muted">
                <li>Kami mencatat nama, kelas, jurusan, jawaban, dan waktu pengiriman Anda.</li>
                <li>Jawaban dipakai sekolah untuk pembinaan talenta digital, bukan untuk nilai rapor atau kelulusan.</li>
                <li>Hasil technostress per siswa hanya dapat dilihat guru yang ditugaskan.</li>
                <li>Setelah dikirim, jawaban tidak bisa diubah.</li>
              </ul>
              <p className="mt-3 text-sm text-fg-muted">Versi pemberitahuan: {survey.consentVersion}</p>
              <div className="mt-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (e.target.checked) setErrors({});
                    }}
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? "consent-error" : undefined}
                    className="mt-0.5 size-5 shrink-0 accent-accent"
                  />
                  <span className="text-sm font-medium">Saya sudah membaca pemberitahuan ini dan setuju jawaban saya diproses.</span>
                </label>
                {errors.consent && (
                  <p id="consent-error" className="mt-2 text-sm font-medium text-danger-text">
                    {errors.consent}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {step.kind === "identity" && (
          <div className="space-y-6">
            <div>
              <h1 ref={headingRef} tabIndex={-1} id="page-title" className="text-xl font-semibold tracking-[-0.01em] outline-none">
                Identitas Anda
              </h1>
              <p className="mt-1 text-fg-muted">Dipakai untuk mengelompokkan hasil per kelas dan jurusan.</p>
            </div>
            <Field id="id-name" label="Nama lengkap" error={errors["id-name"]}>
              <input
                id="id-name"
                name="name"
                autoComplete="name"
                value={identity.name}
                onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                aria-invalid={errors["id-name"] ? true : undefined}
                aria-describedby={describedBy("id-name", false, errors["id-name"])}
                className={inputClass}
              />
            </Field>
            <Field id="id-class" label="Kelas" error={errors["id-class"]}>
              <input
                id="id-class"
                name="class"
                autoComplete="off"
                placeholder="XI RPL 1"
                value={identity.className}
                onChange={(e) => setIdentity({ ...identity, className: e.target.value })}
                aria-invalid={errors["id-class"] ? true : undefined}
                aria-describedby={describedBy("id-class", false, errors["id-class"])}
                className={inputClass}
              />
            </Field>
            <Field id="id-major" label="Jurusan" error={errors["id-major"]}>
              <select
                id="id-major"
                value={identity.major}
                onChange={(e) => setIdentity({ ...identity, major: e.target.value })}
                aria-invalid={errors["id-major"] ? true : undefined}
                aria-describedby={describedBy("id-major", false, errors["id-major"])}
                className={inputClass}
              >
                <option value="">Pilih jurusan</option>
                {MAJORS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {step.kind === "section" && (
          <div className="space-y-8">
            <div>
              <h1 ref={headingRef} tabIndex={-1} id="page-title" className="text-xl font-semibold tracking-[-0.01em] outline-none">
                {sections[step.index].title}
              </h1>
              {sections[step.index].description && <p className="mt-1 text-fg-muted">{sections[step.index].description}</p>}
              <p className="mt-2 text-sm text-fg-muted">Pertanyaan bertanda “Wajib” harus dijawab sebelum lanjut.</p>
            </div>
            {Object.keys(errors).length > 0 && (
              <Notice tone="danger" title={`${formatNumber(Object.keys(errors).length)} pertanyaan wajib belum dijawab`}>
                Jawab pertanyaan yang ditandai di bawah ini, lalu pilih Lanjut lagi.
              </Notice>
            )}
            <ol className="space-y-8">
              {questionsOf(sections[step.index].id).map((q) => (
                <li key={q.id}>
                  <QuestionInput q={q} value={answers[q.code]} error={errors[firstControlId(q)]} onChange={(v) => setAnswers({ ...answers, [q.code]: v })} />
                </li>
              ))}
            </ol>
          </div>
        )}

        {step.kind === "review" && (
          <div className="space-y-6">
            <div>
              <h1 ref={headingRef} tabIndex={-1} id="page-title" className="text-xl font-semibold tracking-[-0.01em] outline-none">
                Tinjau jawaban Anda
              </h1>
              <p className="mt-1 text-fg-muted">Periksa sekali lagi. Setelah dikirim, jawaban tidak bisa diubah.</p>
            </div>
            {sections.map((s, si) => (
              <section key={s.id} aria-labelledby={`rv-${s.id}`} className="rounded-xl border border-line">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <h2 id={`rv-${s.id}`} className="font-semibold">
                    {s.title}
                  </h2>
                  <Button size="sm" variant="ghost" aria-label={`Ubah jawaban bagian ${s.title}`} onClick={() => go(steps.findIndex((x) => x.kind === "section" && x.index === si))}>
                    Ubah
                  </Button>
                </div>
                <dl className="divide-y divide-line">
                  {questionsOf(s.id).map((q) => {
                    const text = answerText(q, answers[q.code]);
                    return (
                      <div key={q.id} className="px-4 py-3">
                        <dt className="text-sm text-fg-muted">{q.text}</dt>
                        <dd className={cx("mt-1 text-sm font-medium break-words", !text && (q.required ? "text-danger-text" : "text-fg-muted"))}>
                          {text ?? (q.required ? "Belum dijawab (wajib)" : "Tidak dijawab (opsional)")}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
            {mode === "preview" && (
              <Notice tone="info" title="Mode pratinjau">
                Menekan Kirim di sini tidak menyimpan respons dan tidak mengubah statistik.
              </Notice>
            )}
            <div role="alert" className="empty:hidden rounded-lg border border-danger-line bg-danger-soft p-3 text-sm text-danger-text">
              {submitError}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap-reverse items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-8">
        {stepIndex > 0 ? (
          <Button onClick={() => go(stepIndex - 1)}>
            <ArrowLeft aria-hidden className="size-4" />
            Kembali
          </Button>
        ) : (
          <span />
        )}
        {step.kind === "review" ? (
          <Button variant="primary" onClick={submit} aria-disabled={sending || undefined} className="min-w-40">
            {sending ? (
              "Mengirim…"
            ) : (
              <>
                <Send aria-hidden className="size-4" />
                Kirim jawaban
              </>
            )}
          </Button>
        ) : (
          <Button variant="primary" onClick={next} className="min-w-32">
            {step.kind === "intro" ? "Mulai mengisi" : "Lanjut"}
            <ArrowRight aria-hidden className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function firstControlId(q: Question) {
  if (q.type === "likert") return `${q.id}-v${q.scale?.min ?? 1}`;
  if (q.type === "single") return `${q.id}-${q.options?.[0]?.id}`;
  return `${q.id}-text`;
}

function answerText(q: Question, v: AnswerValue | undefined): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (q.type === "likert") return `${v}${q.scale?.labels[v as number] ? ` · ${q.scale.labels[v as number]}` : ""}`;
  if (q.type === "single") return q.options?.find((o) => o.id === v)?.label ?? null;
  return String(v);
}

function QuestionInput({ q, value, error, onChange }: { q: Question; value: AnswerValue | undefined; error?: string; onChange: (v: AnswerValue) => void }) {
  const errId = `${q.id}-error`;
  const helpId = `${q.id}-help`;
  const desc = [q.help ? helpId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  const requiredTag = (
    <span className={cx("ms-2 inline-flex rounded-md px-1.5 py-0.5 align-middle text-xs font-medium", q.required ? "bg-accent-soft text-accent-text" : "bg-surface-muted text-fg-muted")}>
      {q.required ? "Wajib" : "Opsional"}
    </span>
  );

  if (q.type === "short") {
    const len = typeof value === "string" ? value.length : 0;
    return (
      <div>
        <label htmlFor={`${q.id}-text`} className="block font-medium">
          {q.text}
          {requiredTag}
        </label>
        {q.help && (
          <p id={helpId} className="mt-1 text-sm text-fg-muted">
            {q.help}
          </p>
        )}
        <textarea
          id={`${q.id}-text`}
          rows={4}
          maxLength={500}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[desc, `${q.id}-count`].filter(Boolean).join(" ")}
          className={cx(inputClass, "mt-3")}
        />
        <p id={`${q.id}-count`} className="mt-1 text-end text-sm text-fg-muted tabular-nums">
          {formatNumber(len)}/500 karakter
        </p>
        {error && (
          <p id={errId} className="mt-1 text-sm font-medium text-danger-text">
            {error}
          </p>
        )}
      </div>
    );
  }

  const options =
    q.type === "likert" && q.scale
      ? Array.from({ length: q.scale.max - q.scale.min + 1 }, (_, i) => {
          const v = q.scale!.min + i;
          return { id: `${q.id}-v${v}`, value: v as AnswerValue, number: String(v), label: q.scale!.labels[v] ?? "" };
        })
      : (q.options ?? []).map((o) => ({ id: `${q.id}-${o.id}`, value: o.id as AnswerValue, number: "", label: o.label }));
  const horizontal = q.type === "likert";

  return (
    <fieldset aria-describedby={desc}>
      <legend className="font-medium">
        {q.text}
        {requiredTag}
      </legend>
      {q.help && (
        <p id={helpId} className="mt-1 text-sm text-fg-muted">
          {q.help}
        </p>
      )}
      <div className={cx("mt-3 grid gap-2", horizontal && "sm:auto-cols-fr sm:grid-flow-col")}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.id}
              htmlFor={o.id}
              className={cx(
                "press flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                horizontal && "sm:flex-col sm:justify-center sm:gap-1 sm:px-2 sm:py-3 sm:text-center",
                checked ? "border-accent bg-accent-soft" : error ? "border-danger-text" : "border-line-input hover:bg-surface-muted",
              )}
            >
              <input
                id={o.id}
                type="radio"
                name={q.id}
                checked={checked}
                onChange={() => onChange(o.value)}
                aria-invalid={error ? true : undefined}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cx(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  checked ? "border-accent" : "border-line-input",
                  horizontal && "sm:hidden",
                )}
              >
                {checked && <span className="size-2.5 rounded-full bg-accent" />}
              </span>
              {o.number && (
                <span className={cx("font-semibold tabular-nums sm:text-lg", checked && "text-accent-text")}>{o.number}</span>
              )}
              {o.label && <span className={cx("text-sm", checked ? "font-medium text-fg" : "text-fg-muted", !o.number && "text-base text-fg")}>{o.label}</span>}
              {horizontal && checked && <CheckCircle2 aria-hidden className="ms-auto hidden size-4 text-accent-text sm:ms-0 sm:block" />}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errId} className="mt-2 text-sm font-medium text-danger-text">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function ClosedState({ title, body, icon = <Lock aria-hidden className="size-8" /> }: { title: string; body: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 text-center sm:p-10">
      <div className="mx-auto inline-flex text-fg-muted">{icon}</div>
      <h1 id="page-title" tabIndex={-1} className="mt-3 text-xl font-semibold tracking-[-0.01em] outline-none">
        {title}
      </h1>
      <div className="mx-auto mt-2 max-w-md text-fg-muted">{body}</div>
    </div>
  );
}
