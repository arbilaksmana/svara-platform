"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, GitBranch, Link2, ListPlus, Plus, Rocket, Trash2 } from "lucide-react";
import { useStore, useSurveyResponses } from "@/lib/store";
import { useDocumentTitle } from "@/lib/hooks";
import { formatNumber, formatTime, uid, validateSurvey } from "@/lib/survey";
import type { Question, QuestionType, Survey } from "@/lib/types";
import { Button, ButtonLink, Card, Dialog, EmptyState, Field, Notice, StatusBadge, Switch, Tag, describedBy, inputClass } from "@/components/ui";
import { RequireRole } from "@/components/app-shell";
import { QuestionCard, defaultScale } from "@/components/question-editor";
import { copyText, publicUrl } from "@/components/survey-list";
import { useToast } from "@/components/toast";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireRole role="creator">
      <Editor id={id} />
    </RequireRole>
  );
}

function Editor({ id }: { id: string }) {
  const { surveys, user, updateSurvey, publish, newVersion } = useStore();
  const survey = surveys.find((s) => s.id === id && s.ownerId === user?.id);
  useDocumentTitle(survey ? `Edit ${survey.title || survey.code}` : "Survei tidak ditemukan");

  if (!survey) {
    return (
      <EmptyState
        title="Survei tidak ditemukan"
        body="Survei ini mungkin milik creator lain atau tautannya salah. Buka daftar survei untuk memilih survei Anda."
        action={<ButtonLink href="/surveys" variant="primary">Buka daftar survei</ButtonLink>}
      />
    );
  }
  return <EditorBody survey={survey} update={(fn) => updateSurvey(survey.id, fn)} publish={publish} newVersion={newVersion} />;
}

function EditorBody({
  survey,
  update,
  publish,
  newVersion,
}: {
  survey: Survey;
  update: (fn: (s: Survey) => Survey) => void;
  publish: (id: string) => void;
  newVersion: (id: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const responses = useSurveyResponses(survey.id);
  const versionResponses = responses.filter((r) => r.versionNo === survey.version).length;
  const readOnly = survey.status !== "draft";
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"none" | "publish" | "published" | "version">("none");
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const issues = validateSurvey(survey);

  useEffect(() => {
    if (!pendingFocus) return;
    const t = setTimeout(() => {
      const el = document.getElementById(pendingFocus);
      el?.focus();
      el?.scrollIntoView({ block: "center" });
      setPendingFocus(null);
    }, 50);
    return () => clearTimeout(t);
  }, [pendingFocus]);

  const set = (patch: Partial<Survey>) => update((s) => ({ ...s, ...patch }));
  const patchQ = (qid: string, patch: Partial<Question>) =>
    update((s) => ({ ...s, questions: s.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)) }));

  function nextCode(prefix = "Q") {
    const used = new Set(survey.questions.map((q) => q.code));
    for (let n = 1; ; n++) {
      const c = `${prefix}${String(n).padStart(2, "0")}`;
      if (!used.has(c)) return c;
    }
  }

  function addQuestion(sectionId: string, type: QuestionType) {
    const q: Question = {
      id: uid("q").toLowerCase(),
      code: nextCode(),
      sectionId,
      type,
      text: "",
      help: "",
      required: type !== "short",
      groupCode: "",
      dimensionCode: "",
      scale: type === "likert" ? defaultScale() : undefined,
      options:
        type === "single"
          ? [
              { id: uid("opt"), label: "Ya" },
              { id: uid("opt"), label: "Tidak" },
            ]
          : undefined,
    };
    update((s) => ({ ...s, questions: [...s.questions, q] }));
    setExpanded(q.id);
    setPendingFocus(`${q.id}-text`);
  }

  function move(qid: string, dir: -1 | 1) {
    update((s) => {
      const list = [...s.questions];
      const q = list.find((x) => x.id === qid)!;
      const siblings = list.filter((x) => x.sectionId === q.sectionId);
      const pos = siblings.indexOf(q);
      const other = siblings[pos + dir];
      if (!other) return s;
      const a = list.indexOf(q);
      const b = list.indexOf(other);
      [list[a], list[b]] = [list[b], list[a]];
      return { ...s, questions: list };
    });
  }

  function removeQuestion(q: Question) {
    const before = survey.questions;
    update((s) => ({ ...s, questions: s.questions.filter((x) => x.id !== q.id) }));
    toast({
      message: `Pertanyaan ${q.code} dihapus.`,
      action: { label: "Urungkan", onClick: () => update((s) => ({ ...s, questions: before })) },
    });
  }

  function fix(fieldId: string) {
    setDialog("none");
    const q = survey.questions.find((x) => fieldId.startsWith(x.id));
    if (q) setExpanded(q.id);
    setPendingFocus(fieldId);
  }

  const url = publicUrl(survey.token);

  return (
    <div className="space-y-6">
      <Link href="/surveys" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" />
        Semua survei
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{survey.code}</Tag>
            <StatusBadge status={survey.status} />
            <span className="text-sm text-fg-muted">Versi {survey.version}</span>
          </div>
          <h1 id="page-title" tabIndex={-1} className="mt-2 text-2xl font-semibold tracking-[-0.015em] break-words outline-none">
            {survey.title || "Survei tanpa judul"}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {readOnly ? "Hanya baca." : `Perubahan tersimpan otomatis sebagai draf · ${formatTime(survey.updatedAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/preview/${survey.id}`}>
            <Eye aria-hidden className="size-4" />
            Pratinjau
          </ButtonLink>
          {readOnly ? (
            <ButtonLink href={`/surveys/${survey.id}/results`} variant="primary">
              Lihat hasil
            </ButtonLink>
          ) : (
            <Button variant="primary" onClick={() => setDialog("publish")}>
              <Rocket aria-hidden className="size-4" />
              Publikasikan
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <Notice tone="warning" icon={<GitBranch aria-hidden />} title={`Versi ${survey.version} terkunci`}>
          <p>
            Survei ini {survey.status === "published" ? "sedang dipublikasikan" : "sudah tidak menerima respons"} dan memiliki{" "}
            <strong>{formatNumber(versionResponses)} respons</strong> pada versi ini. Agar respons lama tetap konsisten, ubah pertanyaan
            lewat versi baru.
          </p>
          <Button className="mt-3" size="sm" onClick={() => setDialog("version")}>
            <GitBranch aria-hidden className="size-4" />
            Buat versi {survey.version + 1}
          </Button>
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card aria-labelledby="info-title" className="p-5 sm:p-6">
            <h2 id="info-title" className="text-lg font-semibold tracking-[-0.01em]">
              Informasi survei
            </h2>
            <fieldset disabled={readOnly} className="mt-5 grid gap-5 sm:grid-cols-2">
              <legend className="sr-only">Informasi survei</legend>
              <Field id="survey-title" label="Judul" required className="sm:col-span-2" error={!survey.title.trim() ? "Tulis judul yang dikenali siswa." : undefined}>
                <input
                  id="survey-title"
                  value={survey.title}
                  onChange={(e) => set({ title: e.target.value })}
                  aria-invalid={!survey.title.trim() || undefined}
                  aria-describedby={describedBy("survey-title", false, !survey.title.trim())}
                  placeholder="Adopsi Teknologi dan Technostress Siswa SMK"
                  className={inputClass}
                />
              </Field>
              <Field id="survey-desc" label="Deskripsi" optional className="sm:col-span-2">
                <textarea id="survey-desc" rows={2} value={survey.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
              </Field>
              <Field id="survey-purpose" label="Tujuan" optional hint="Ditampilkan kepada siswa sebelum mereka setuju mengisi." className="sm:col-span-2">
                <textarea id="survey-purpose" rows={2} value={survey.purpose} aria-describedby="survey-purpose-hint" onChange={(e) => set({ purpose: e.target.value })} className={inputClass} />
              </Field>
              <Field id="survey-instr" label="Petunjuk pengisian" optional hint="Jelaskan arti angka pada skala. Label tidak selalu “setuju–tidak setuju”." className="sm:col-span-2">
                <textarea id="survey-instr" rows={3} value={survey.instructions} aria-describedby="survey-instr-hint" onChange={(e) => set({ instructions: e.target.value })} className={inputClass} />
              </Field>
              <Field id="survey-topic" label="Topik" optional>
                <input id="survey-topic" value={survey.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="Adopsi teknologi" className={inputClass} />
              </Field>
              <Field id="survey-audience" label="Kelompok sasaran" optional>
                <input id="survey-audience" value={survey.audience} onChange={(e) => set({ audience: e.target.value })} placeholder="Siswa kelas XI RPL" className={inputClass} />
              </Field>
            </fieldset>
          </Card>

          <Card aria-labelledby="mode-title" className="p-5 sm:p-6">
            <h2 id="mode-title" className="text-lg font-semibold tracking-[-0.01em]">
              Cara pengisian
            </h2>
            <fieldset disabled={readOnly} className="mt-5 space-y-5">
              <legend className="sr-only">Cara pengisian</legend>
              <Switch
                id="mode-standalone"
                checked={survey.allowStandalone}
                onChange={(v) => set({ allowStandalone: v })}
                label="Terima pengisian lewat tautan publik"
                description="Mode mandiri. Siswa mengisi nama, kelas, dan jurusan sendiri. Tetap tersedia saat Modul 13 tidak bisa dihubungi."
              />
              <Switch
                id="mode-integrated"
                checked={survey.allowIntegrated}
                onChange={(v) => set({ allowIntegrated: v })}
                label="Ambil identitas siswa dari Modul 13"
                description="Mode terintegrasi. Siswa yang masuk lewat akun sekolah tidak perlu mengisi identitas lagi."
              />
              {!survey.allowStandalone && !survey.allowIntegrated && (
                <p className="text-sm font-medium text-danger-text">Aktifkan minimal satu cara pengisian agar siswa bisa menjawab.</p>
              )}
            </fieldset>
          </Card>

          {survey.sections.map((section, si) => {
            const qs = survey.questions.filter((q) => q.sectionId === section.id);
            const offset = survey.sections.slice(0, si).reduce((n, s) => n + survey.questions.filter((q) => q.sectionId === s.id).length, 0);
            return (
              <Card key={section.id} aria-labelledby={`${section.id}-heading`} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 id={`${section.id}-heading`} className="text-lg font-semibold tracking-[-0.01em]">
                    Bagian {si + 1}
                    <span className="sr-only">: {section.title}</span>
                  </h2>
                  {!readOnly && survey.sections.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger-text hover:bg-danger-soft"
                      onClick={() => {
                        const before = survey;
                        const target = survey.sections[si === 0 ? 1 : 0].id;
                        update((s) => ({
                          ...s,
                          sections: s.sections.filter((x) => x.id !== section.id),
                          questions: s.questions.map((q) => (q.sectionId === section.id ? { ...q, sectionId: target } : q)),
                        }));
                        toast({
                          message: qs.length
                            ? `Bagian ${si + 1} dihapus. ${qs.length} pertanyaannya dipindah ke bagian lain.`
                            : `Bagian ${si + 1} dihapus.`,
                          action: { label: "Urungkan", onClick: () => update(() => before) },
                        });
                      }}
                    >
                      <Trash2 aria-hidden className="size-4" />
                      Hapus bagian
                    </Button>
                  )}
                </div>
                <fieldset disabled={readOnly} className="mt-4 grid gap-4 sm:grid-cols-2">
                  <legend className="sr-only">Judul dan deskripsi bagian {si + 1}</legend>
                  <Field id={`${section.id}-title`} label="Judul bagian">
                    <input
                      id={`${section.id}-title`}
                      value={section.title}
                      onChange={(e) => update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === section.id ? { ...x, title: e.target.value } : x)) }))}
                      className={inputClass}
                    />
                  </Field>
                  <Field id={`${section.id}-desc`} label="Deskripsi bagian" optional>
                    <input
                      id={`${section.id}-desc`}
                      value={section.description}
                      onChange={(e) => update((s) => ({ ...s, sections: s.sections.map((x) => (x.id === section.id ? { ...x, description: e.target.value } : x)) }))}
                      className={inputClass}
                    />
                  </Field>
                </fieldset>

                <h3 className="mt-6 text-sm font-semibold">
                  Pertanyaan <span className="font-normal text-fg-muted tabular-nums">({formatNumber(qs.length)})</span>
                </h3>
                {qs.length ? (
                  <ol className="mt-3 space-y-3">
                    {qs.map((q, i) => (
                      <QuestionCard
                        key={q.id}
                        q={q}
                        index={offset + i}
                        all={survey.questions}
                        sections={survey.sections}
                        expanded={expanded === q.id}
                        onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
                        onChange={(p) => patchQ(q.id, p)}
                        onMove={(d) => move(q.id, d)}
                        canMoveUp={i > 0}
                        canMoveDown={i < qs.length - 1}
                        onDuplicate={() => {
                          const copy = { ...structuredClone(q), id: uid("q").toLowerCase(), code: nextCode(q.code.replace(/\d+$/, "") || "Q") };
                          update((s) => {
                            const list = [...s.questions];
                            list.splice(list.indexOf(list.find((x) => x.id === q.id)!) + 1, 0, copy);
                            return { ...s, questions: list };
                          });
                          setExpanded(copy.id);
                          setPendingFocus(`${copy.id}-code`);
                        }}
                        onDelete={() => removeQuestion(q)}
                        readOnly={readOnly}
                      />
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed border-line-input p-4 text-sm text-fg-muted">
                    Bagian ini belum punya pertanyaan. Tambahkan pertanyaan Likert untuk data berskor atau jawaban singkat untuk keluhan.
                  </p>
                )}

                {!readOnly && (
                  <div className="mt-4 flex flex-wrap gap-2" id={si === 0 ? "add-question" : undefined} tabIndex={si === 0 ? -1 : undefined}>
                    <Button size="sm" onClick={() => addQuestion(section.id, "likert")}>
                      <Plus aria-hidden className="size-4" />
                      Skala Likert
                    </Button>
                    <Button size="sm" onClick={() => addQuestion(section.id, "short")}>
                      <Plus aria-hidden className="size-4" />
                      Jawaban singkat
                    </Button>
                    <Button size="sm" onClick={() => addQuestion(section.id, "single")}>
                      <Plus aria-hidden className="size-4" />
                      Pilihan tunggal
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}

          {!readOnly && (
            <Button
              onClick={() => {
                const id = uid("sec").toLowerCase();
                update((s) => ({ ...s, sections: [...s.sections, { id, title: `Bagian ${s.sections.length + 1}`, description: "" }] }));
                setPendingFocus(`${id}-title`);
              }}
            >
              <ListPlus aria-hidden className="size-4" />
              Tambah bagian
            </Button>
          )}
        </div>

        <aside aria-labelledby="check-title" className="lg:sticky lg:top-10">
          <Card className="p-5">
            <h2 id="check-title" className="font-semibold">
              Siap dipublikasikan?
            </h2>
            {issues.length ? (
              <>
                <p className="mt-1 text-sm text-fg-muted">
                  {formatNumber(issues.length)} hal perlu dilengkapi.
                </p>
                <ul className="mt-3 space-y-2">
                  {issues.slice(0, 6).map((i) => (
                    <li key={i.fieldId + i.message} className="flex gap-2 text-sm">
                      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning-text" />
                      <button type="button" onClick={() => fix(i.fieldId)} className="text-start underline underline-offset-4 hover:no-underline">
                        {i.message}
                      </button>
                    </li>
                  ))}
                </ul>
                {issues.length > 6 && <p className="mt-2 text-sm text-fg-muted">dan {formatNumber(issues.length - 6)} lainnya.</p>}
              </>
            ) : (
              <p className="mt-2 flex gap-2 text-sm">
                <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success-text" />
                Semua pertanyaan lengkap.
              </p>
            )}
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">Bagian</dt>
                <dd className="font-medium tabular-nums">{formatNumber(survey.sections.length)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">Pertanyaan berskor</dt>
                <dd className="font-medium tabular-nums">{formatNumber(survey.questions.filter((q) => q.type === "likert").length)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">Tanpa skor</dt>
                <dd className="font-medium tabular-nums">{formatNumber(survey.questions.filter((q) => q.type !== "likert").length)}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>

      <Dialog
        open={dialog === "publish"}
        onClose={() => setDialog("none")}
        title={issues.length ? "Lengkapi survei sebelum publikasi" : `Publikasikan “${survey.title}” versi ${survey.version}?`}
        description={
          issues.length
            ? `${formatNumber(issues.length)} hal di bawah ini perlu diperbaiki. Pilih salah satu untuk langsung menuju kolomnya.`
            : "Siswa bisa langsung mengisi lewat tautan. Setelah respons pertama masuk, perubahan pertanyaan harus dibuat sebagai versi baru."
        }
        footer={
          issues.length ? (
            <Button onClick={() => setDialog("none")}>Kembali ke editor</Button>
          ) : (
            <>
              <Button onClick={() => setDialog("none")}>Batal</Button>
              <Button
                variant="primary"
                onClick={() => {
                  publish(survey.id);
                  setDialog("published");
                }}
              >
                <Rocket aria-hidden className="size-4" />
                Publikasikan survei
              </Button>
            </>
          )
        }
      >
        {issues.length > 0 && (
          <ul className="space-y-2">
            {issues.map((i) => (
              <li key={i.fieldId + i.message} className="flex gap-2 text-sm">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning-text" />
                <button type="button" onClick={() => fix(i.fieldId)} className="text-start underline underline-offset-4 hover:no-underline">
                  {i.message}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!issues.length && (
          <ul className="list-disc space-y-1 ps-5 text-sm text-fg-muted">
            <li>{formatNumber(survey.questions.length)} pertanyaan dalam {formatNumber(survey.sections.length)} bagian</li>
            <li>{survey.allowStandalone ? "Tautan publik aktif untuk mode mandiri" : "Hanya untuk siswa yang masuk lewat Modul 13"}</li>
            <li>Skor tersimpan sebagai angka sesuai nilai opsi, bukan label</li>
          </ul>
        )}
      </Dialog>

      <Dialog
        open={dialog === "published"}
        onClose={() => setDialog("none")}
        title="Survei sudah dipublikasikan"
        description="Bagikan tautan ini kepada siswa. Tautan menerima respons sampai Anda menutup survei."
        footer={
          <>
            <Button onClick={() => router.push(`/surveys/${survey.id}/results`)}>Buka halaman hasil</Button>
            <Button
              variant="primary"
              onClick={async () => {
                const ok = await copyText(url);
                toast({ message: ok ? "Tautan survei disalin." : "Tidak bisa menyalin otomatis. Pilih teks tautan, lalu salin manual." });
              }}
            >
              <Link2 aria-hidden className="size-4" />
              Salin tautan
            </Button>
          </>
        }
      >
        <label htmlFor="share-url" className="text-sm font-medium">
          Tautan survei
        </label>
        <input id="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={`${inputClass} mt-1.5 font-mono`} />
      </Dialog>

      <Dialog
        open={dialog === "version"}
        onClose={() => setDialog("none")}
        title={`Buat versi ${survey.version + 1} dari “${survey.title}”?`}
        description={`Versi ${survey.version} beserta ${formatNumber(versionResponses)} responsnya tetap tersimpan dan terbaca. Versi baru dibuka sebagai draf, dan tautan berhenti menerima respons sampai versi baru dipublikasikan.`}
        footer={
          <>
            <Button onClick={() => setDialog("none")}>Batal</Button>
            <Button
              variant="primary"
              onClick={() => {
                newVersion(survey.id);
                setDialog("none");
                toast({ message: `Versi ${survey.version + 1} dibuat sebagai draf.` });
              }}
            >
              <GitBranch aria-hidden className="size-4" />
              Buat versi {survey.version + 1}
            </Button>
          </>
        }
      />
    </div>
  );
}
