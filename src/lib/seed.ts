import type {
  AuditEntry,
  LikertScale,
  Question,
  Survey,
  SurveyResponse,
  UserProfile,
} from "./types";

export const CONSENT_VERSION = "PRIV-2026.1";

export const USERS: UserProfile[] = [
  {
    id: "usr-rina",
    role: "creator",
    name: "Rina Kartika",
    email: "rina@smklugina.sch.id",
    title: "Guru Produktif RPL",
    status: "active",
  },
  {
    id: "usr-dedi",
    role: "creator",
    name: "Dedi Supriatna",
    email: "dedi@smklugina.sch.id",
    title: "Asesor UI/UX",
    status: "active",
  },
  {
    id: "usr-admin",
    role: "super_admin",
    name: "Admin Sekolah",
    email: "admin@smklugina.sch.id",
    title: "Super admin",
    status: "active",
  },
];

export const DEMO_PASSWORD = "demo1234";

const AGREE: LikertScale = {
  min: 1,
  max: 5,
  labels: {
    1: "Sangat tidak setuju",
    2: "Tidak setuju",
    3: "Ragu-ragu",
    4: "Setuju",
    5: "Sangat setuju",
  },
};

const FREQUENCY: LikertScale = {
  min: 1,
  max: 5,
  labels: { 1: "Tidak pernah", 2: "Jarang", 3: "Kadang-kadang", 4: "Sering", 5: "Selalu" },
};

function likert(
  code: string,
  sectionId: string,
  text: string,
  scale: LikertScale,
  group: string,
  dimension: string,
): Question {
  return {
    id: `q-${code.toLowerCase()}`,
    code,
    sectionId,
    type: "likert",
    text,
    help: "",
    required: true,
    groupCode: group,
    dimensionCode: dimension,
    scale: { ...scale, labels: { ...scale.labels } },
  };
}

const caseStudy: Survey = {
  id: "surv-001",
  code: "SURV-001",
  ownerId: "usr-rina",
  title: "Adopsi Teknologi dan Technostress Siswa SMK",
  description:
    "Survei pengalaman siswa saat memakai aplikasi pembelajaran untuk tugas UI/UX semester ganjil.",
  purpose:
    "Memahami seberapa mudah siswa memakai aplikasi pembelajaran dan apakah teknologi menambah beban tugas.",
  instructions:
    "Pilih angka yang paling sesuai dengan pengalaman Anda. Arti setiap angka tertulis di bawahnya. Tidak ada jawaban benar atau salah, dan jawaban Anda tidak memengaruhi nilai rapor.",
  topic: "Adopsi teknologi dan technostress",
  audience: "Siswa kelas XI dan XII",
  status: "published",
  version: 1,
  versions: [
    {
      versionNo: 1,
      publishedAt: "2026-10-27T01:00:00Z",
      lockedAt: "2026-10-27T02:14:00Z",
      questionCount: 8,
    },
  ],
  sections: [
    {
      id: "sec-ad",
      title: "Adopsi teknologi",
      description: "Pengalaman Anda saat memakai aplikasi pembelajaran untuk tugas UI/UX.",
    },
    {
      id: "sec-ts",
      title: "Technostress",
      description: "Seberapa sering teknologi terasa membebani saat Anda mengerjakan tugas.",
    },
    {
      id: "sec-k",
      title: "Keluhan dan pengalaman",
      description: "Ceritakan kendala yang Anda alami. Bagian ini tidak diberi skor.",
    },
  ],
  questions: [
    likert("AD01", "sec-ad", "Aplikasi pembelajaran membantu saya menyelesaikan tugas UI/UX.", AGREE, "ADOPSI", "PU"),
    likert("AD02", "sec-ad", "Saya mudah memahami cara menggunakan aplikasi tersebut.", AGREE, "ADOPSI", "PEOU"),
    likert("AD03", "sec-ad", "Saya bersedia menggunakan aplikasi tersebut pada tugas berikutnya.", AGREE, "ADOPSI", "BI"),
    likert("TS01", "sec-ts", "Saya merasa terbebani ketika harus menggunakan banyak fitur teknologi.", FREQUENCY, "TECHNOSTRESS", "OVERLOAD"),
    likert("TS02", "sec-ts", "Saya mengalami kesulitan memahami langkah penggunaan aplikasi.", FREQUENCY, "TECHNOSTRESS", "COMPLEXITY"),
    likert("TS03", "sec-ts", "Penggunaan teknologi mengganggu waktu saya untuk menyelesaikan tugas.", FREQUENCY, "TECHNOSTRESS", "INVASION"),
    {
      id: "q-k01",
      code: "K01",
      sectionId: "sec-k",
      type: "single",
      text: "Apakah Anda mengalami kendala penggunaan teknologi?",
      help: "",
      required: true,
      groupCode: "KELUHAN",
      dimensionCode: "",
      options: [
        { id: "opt-ya", label: "Ya" },
        { id: "opt-tidak", label: "Tidak" },
      ],
    },
    {
      id: "q-k02",
      code: "K02",
      sectionId: "sec-k",
      type: "short",
      text: "Ceritakan kendala penggunaan teknologi yang Anda alami.",
      help: "Boleh dikosongkan. Contoh: aplikasi sering keluar sendiri saat mengunggah desain.",
      required: false,
      groupCode: "KELUHAN",
      dimensionCode: "",
    },
  ],
  token: "adopsi-ts-2026",
  allowStandalone: true,
  allowIntegrated: true,
  consentVersion: CONSENT_VERSION,
  createdAt: "2026-10-23T03:00:00Z",
  updatedAt: "2026-10-27T01:00:00Z",
};

const lms: Survey = {
  ...caseStudy,
  id: "surv-002",
  code: "SURV-002",
  title: "Evaluasi Aplikasi LMS Semester Ganjil",
  description: "Kepuasan siswa terhadap LMS sekolah setelah satu semester.",
  purpose: "Menentukan fitur LMS yang perlu dibenahi sebelum semester genap.",
  instructions: "Pilih angka 1 sampai 4. Angka 1 berarti sangat kurang, angka 4 berarti sangat baik.",
  topic: "Kepuasan LMS",
  audience: "Seluruh siswa kelas X",
  status: "closed",
  version: 2,
  versions: [
    { versionNo: 1, publishedAt: "2026-09-01T01:00:00Z", lockedAt: "2026-09-01T03:00:00Z", questionCount: 2 },
    { versionNo: 2, publishedAt: "2026-09-08T01:00:00Z", lockedAt: "2026-09-08T02:00:00Z", questionCount: 3 },
  ],
  sections: [{ id: "sec-lms", title: "Penilaian LMS", description: "" }],
  questions: [
    likert("LMS01", "sec-lms", "Materi di LMS mudah ditemukan.", { min: 1, max: 4, labels: { 1: "Sangat kurang", 2: "Kurang", 3: "Baik", 4: "Sangat baik" } }, "LMS", "NAV"),
    likert("LMS02", "sec-lms", "LMS dapat dibuka lancar dari ponsel saya.", { min: 1, max: 4, labels: { 1: "Sangat kurang", 2: "Kurang", 3: "Baik", 4: "Sangat baik" } }, "LMS", "AKSES"),
    {
      id: "q-lms03",
      code: "LMS03",
      sectionId: "sec-lms",
      type: "short",
      text: "Fitur apa yang paling ingin Anda perbaiki?",
      help: "",
      required: false,
      groupCode: "LMS",
      dimensionCode: "",
    },
  ],
  token: "lms-ganjil-2026",
  allowIntegrated: false,
  createdAt: "2026-08-28T03:00:00Z",
  updatedAt: "2026-09-30T09:00:00Z",
};

const pkl: Survey = {
  ...caseStudy,
  id: "surv-003",
  code: "SURV-003",
  title: "Kesiapan Praktik Kerja Lapangan (PKL)",
  description: "Kesiapan teknis siswa sebelum berangkat PKL.",
  purpose: "Memetakan keterampilan yang perlu diperkuat sebelum PKL dimulai.",
  instructions: "",
  topic: "Kesiapan PKL",
  audience: "Siswa kelas XI",
  status: "draft",
  version: 1,
  versions: [{ versionNo: 1, publishedAt: null, lockedAt: null, questionCount: 2 }],
  sections: [{ id: "sec-pkl", title: "Keterampilan teknis", description: "" }],
  questions: [
    likert("PKL01", "sec-pkl", "Saya yakin dapat memakai perangkat lunak desain di tempat PKL.", { min: 1, max: 6, labels: { 1: "Sangat tidak yakin", 6: "Sangat yakin" } }, "PKL", "TEKNIS"),
    likert("PKL02", "sec-pkl", "Saya terbiasa bekerja dengan tenggat dari klien.", { min: 1, max: 6, labels: { 1: "Sangat tidak terbiasa", 6: "Sangat terbiasa" } }, "PKL", "KERJA"),
  ],
  token: "pkl-kesiapan-2026",
  createdAt: "2026-11-03T07:00:00Z",
  updatedAt: "2026-11-04T08:30:00Z",
};

const daring: Survey = {
  ...lms,
  id: "surv-004",
  code: "SURV-004",
  title: "Kebiasaan Belajar Daring 2025",
  description: "Pola belajar daring siswa tahun ajaran sebelumnya.",
  status: "archived",
  version: 1,
  versions: [{ versionNo: 1, publishedAt: "2025-08-04T01:00:00Z", lockedAt: "2025-08-04T03:00:00Z", questionCount: 3 }],
  token: "daring-2025",
  createdAt: "2025-07-28T03:00:00Z",
  updatedAt: "2025-09-15T03:00:00Z",
};

const lab: Survey = {
  ...lms,
  id: "surv-005",
  code: "SURV-005",
  ownerId: "usr-dedi",
  title: "Pemakaian Perangkat Lab RPL",
  description: "Kenyamanan siswa memakai komputer lab untuk tugas desain.",
  status: "published",
  version: 1,
  versions: [{ versionNo: 1, publishedAt: "2026-10-30T01:00:00Z", lockedAt: "2026-10-30T04:00:00Z", questionCount: 3 }],
  token: "lab-rpl-2026",
  createdAt: "2026-10-29T03:00:00Z",
  updatedAt: "2026-10-30T01:00:00Z",
};

export const SEED_SURVEYS: Survey[] = [caseStudy, lms, pkl, daring, lab];

/* ---------- Deterministic responses ---------- */

function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const FIRST = ["Aldi", "Bunga", "Cahya", "Dimas", "Elsa", "Fajar", "Gita", "Hana", "Ilham", "Jihan", "Kevin", "Laras", "Mira", "Naufal", "Putri", "Rizky", "Salsa", "Taufik", "Wulan", "Yoga"];
const CLASSES = [
  ["XI RPL 1", "RPL"],
  ["XI RPL 2", "RPL"],
  ["XI DKV 1", "DKV"],
  ["XII RPL 1", "RPL"],
  ["XII TKJ 2", "TKJ"],
] as const;
const COMPLAINTS = [
  "Aplikasi sering keluar sendiri saat mengunggah file desain.",
  "Sinyal di kelas lemah, jadi halaman lama terbuka.",
  "Terlalu banyak aplikasi yang harus dipasang untuk satu tugas.",
  "Petunjuk tugas di LMS kadang tidak lengkap.",
];

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fromCounts(counts: number[], min: number, rand: () => number): number[] {
  const out: number[] = [];
  counts.forEach((c, i) => {
    for (let k = 0; k < c; k++) out.push(min + i);
  });
  return shuffle(out, rand);
}

function pick(weights: number[], min: number, rand: () => number) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return min + i;
  }
  return min + weights.length - 1;
}

function makeResponses(
  survey: Survey,
  n: number,
  seed: number,
  startIso: string,
  spanDays: number,
  fixed: Record<string, number[]> = {},
  versionOf: (i: number) => number = () => survey.version,
): SurveyResponse[] {
  const rand = prng(seed);
  const fixedSeq: Record<string, number[]> = {};
  for (const [code, counts] of Object.entries(fixed)) {
    const q = survey.questions.find((x) => x.code === code);
    fixedSeq[code] = fromCounts(counts, q?.scale?.min ?? 1, rand);
  }
  const start = new Date(startIso).getTime();
  const list: SurveyResponse[] = [];
  for (let i = 0; i < n; i++) {
    const [className, major] = CLASSES[Math.floor(rand() * CLASSES.length)];
    const integrated = rand() < 0.3;
    const submitted = new Date(start + Math.floor(rand() * spanDays * 86400000)).toISOString();
    const answers: SurveyResponse["answers"] = {};
    for (const q of survey.questions) {
      if (q.type === "likert" && q.scale) {
        const size = q.scale.max - q.scale.min + 1;
        const weights = Array.from({ length: size }, (_, k) =>
          q.groupCode === "TECHNOSTRESS" ? size - k + 1 : k + 2,
        );
        answers[q.code] = fixedSeq[q.code]?.[i] ?? pick(weights, q.scale.min, rand);
      } else if (q.type === "single" && q.options) {
        answers[q.code] = q.options[rand() < 0.42 ? 0 : 1].id;
      } else {
        answers[q.code] = rand() < 0.35 ? COMPLAINTS[Math.floor(rand() * COMPLAINTS.length)] : null;
      }
    }
    const idx = String(i + 1).padStart(3, "0");
    list.push({
      id: `${survey.code}-R${idx}`,
      surveyId: survey.id,
      versionNo: versionOf(i),
      respondent: {
        id: integrated ? `STD-${1000 + i}` : `LOC-${survey.code.slice(-3)}-${idx}`,
        name: `${FIRST[i % FIRST.length]} ${String.fromCharCode(65 + Math.floor(rand() * 26))}.`,
        className,
        major,
        source: integrated ? "integrated_module_13" : "standalone",
      },
      consentVersion: CONSENT_VERSION,
      consentedAt: submitted,
      submittedAt: submitted,
      idempotencyKey: `seed-${survey.id}-${i}`,
      answers,
    });
  }
  return list.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export const SEED_RESPONSES: SurveyResponse[] = [
  // Matches the worked example in SRS §10.3: AD01 = 5, 8, 12, 15, 10.
  ...makeResponses(caseStudy, 50, 14, "2026-10-27T02:00:00Z", 9, { AD01: [5, 8, 12, 15, 10] }),
  ...makeResponses(lms, 18, 7, "2026-09-02T02:00:00Z", 20, {}, (i) => (i < 6 ? 1 : 2)),
  ...makeResponses(daring, 12, 3, "2025-08-05T02:00:00Z", 30),
  ...makeResponses(lab, 9, 21, "2026-10-30T02:00:00Z", 6),
];

export const SEED_AUDIT: AuditEntry[] = [
  { id: "log-1", at: "2026-10-23T03:00:00Z", actorId: "usr-rina", action: "survey.create", objectType: "survey", objectId: "surv-001", detail: "Membuat draf SURV-001" },
  { id: "log-2", at: "2026-10-27T01:00:00Z", actorId: "usr-rina", action: "survey.publish", objectType: "survey", objectId: "surv-001", detail: "Memublikasikan SURV-001 versi 1" },
  { id: "log-3", at: "2026-09-30T09:00:00Z", actorId: "usr-rina", action: "survey.close", objectType: "survey", objectId: "surv-002", detail: "Menutup SURV-002" },
  { id: "log-4", at: "2026-10-30T01:00:00Z", actorId: "usr-dedi", action: "survey.publish", objectType: "survey", objectId: "surv-005", detail: "Memublikasikan SURV-005 versi 1" },
  { id: "log-5", at: "2026-11-04T08:30:00Z", actorId: "usr-rina", action: "survey.update", objectType: "survey", objectId: "surv-003", detail: "Mengubah draf SURV-003" },
  { id: "log-6", at: "2026-11-05T02:10:00Z", actorId: "usr-rina", action: "results.export", objectType: "survey", objectId: "surv-001", detail: "Mengekspor CSV SURV-001 versi 1" },
];
