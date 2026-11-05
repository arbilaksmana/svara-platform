// Logical data model from SRS Modul 14 §11, shaped for the UI prototype.
// Swap the in-browser store for Supabase without changing these shapes.

export type Role = "super_admin" | "creator";

export interface UserProfile {
  id: string;
  role: Role;
  name: string;
  email: string;
  title: string;
  status: "active" | "inactive";
}

export type SurveyStatus = "draft" | "published" | "closed" | "archived";

export type QuestionType = "likert" | "short" | "single";

export interface LikertScale {
  min: number;
  max: number;
  /** Label per numeric value. Missing values show only the number. */
  labels: Record<number, string>;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  code: string;
  sectionId: string;
  type: QuestionType;
  text: string;
  help: string;
  required: boolean;
  groupCode: string;
  dimensionCode: string;
  scale?: LikertScale;
  /** Reverse-scored mapping, stored as metadata for Modul 15 (BR-08, §10.1). */
  reversed?: boolean;
  options?: ChoiceOption[];
}

export interface Section {
  id: string;
  title: string;
  description: string;
}

export interface VersionRecord {
  versionNo: number;
  publishedAt: string | null;
  lockedAt: string | null;
  questionCount: number;
}

export interface Survey {
  id: string;
  code: string;
  ownerId: string;
  title: string;
  description: string;
  purpose: string;
  instructions: string;
  topic: string;
  audience: string;
  status: SurveyStatus;
  version: number;
  versions: VersionRecord[];
  sections: Section[];
  questions: Question[];
  token: string;
  allowStandalone: boolean;
  allowIntegrated: boolean;
  consentVersion: string;
  createdAt: string;
  updatedAt: string;
}

export type ResponseSource = "standalone" | "integrated_module_13";

export interface Respondent {
  id: string;
  name: string;
  className: string;
  major: string;
  source: ResponseSource;
}

export type AnswerValue = number | string | null;

export interface SurveyResponse {
  id: string;
  surveyId: string;
  versionNo: number;
  respondent: Respondent;
  consentVersion: string;
  consentedAt: string;
  submittedAt: string;
  idempotencyKey: string;
  answers: Record<string, AnswerValue>;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  action:
    | "survey.create"
    | "survey.update"
    | "survey.publish"
    | "survey.close"
    | "survey.reopen"
    | "survey.archive"
    | "survey.restore"
    | "survey.duplicate"
    | "survey.new_version"
    | "results.view"
    | "results.export"
    | "auth.login";
  objectType: "survey" | "session";
  objectId: string;
  detail: string;
}
