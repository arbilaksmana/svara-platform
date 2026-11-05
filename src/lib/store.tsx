"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEMO_PASSWORD, SEED_AUDIT, SEED_RESPONSES, SEED_SURVEYS, USERS } from "./seed";
import type { AuditEntry, Survey, SurveyResponse, UserProfile } from "./types";
import { uid } from "./survey";

/*
 * Prototype store. Everything lives in localStorage so the whole flow can be
 * clicked through without a backend. Each method mirrors an endpoint in
 * SRS §12.1, which is where the Supabase calls go later.
 */

interface State {
  sessionUserId: string | null;
  surveys: Survey[];
  responses: SurveyResponse[];
  audit: AuditEntry[];
}

const KEY = "svara-m14-demo-v1";

const initialState = (): State => ({
  sessionUserId: null,
  surveys: structuredClone(SEED_SURVEYS),
  responses: structuredClone(SEED_RESPONSES),
  audit: structuredClone(SEED_AUDIT),
});

type SubmitResult =
  | { ok: true; response: SurveyResponse; replayed: boolean }
  | { ok: false; reason: "not_found" | "not_open" | "conflict" };

interface Store extends State {
  hydrated: boolean;
  user: UserProfile | null;
  users: UserProfile[];
  login(email: string, password: string): UserProfile | null;
  logout(): void;
  createSurvey(): Survey;
  updateSurvey(id: string, fn: (s: Survey) => Survey): void;
  setStatus(id: string, status: Survey["status"]): void;
  publish(id: string): void;
  newVersion(id: string): void;
  duplicate(id: string): Survey | null;
  submitResponse(token: string, draft: Omit<SurveyResponse, "id" | "surveyId" | "versionNo" | "submittedAt">): SubmitResult;
  log(entry: Omit<AuditEntry, "id" | "at" | "actorId">): void;
  resetDemo(): void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw) as State);
    } catch {
      // Corrupt storage falls back to the seed data.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const now = () => new Date().toISOString();

  const log = useCallback<Store["log"]>((entry) => {
    setState((s) => ({
      ...s,
      audit: [
        { ...entry, id: uid("log"), at: now(), actorId: s.sessionUserId ?? "public" },
        ...s.audit,
      ],
    }));
  }, []);

  const updateSurvey = useCallback<Store["updateSurvey"]>((id, fn) => {
    setState((s) => ({
      ...s,
      surveys: s.surveys.map((x) => (x.id === id ? { ...fn(x), updatedAt: now() } : x)),
    }));
  }, []);

  const store = useMemo<Store>(() => {
    const user = USERS.find((u) => u.id === state.sessionUserId) ?? null;
    return {
      ...state,
      hydrated,
      user,
      users: USERS,
      login(email, password) {
        const found = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!found || password !== DEMO_PASSWORD || found.status !== "active") return null;
        setState((s) => ({ ...s, sessionUserId: found.id }));
        return found;
      },
      logout() {
        setState((s) => ({ ...s, sessionUserId: null }));
      },
      createSurvey() {
        const n = stateRef.current.surveys.length + 1;
        const code = `SURV-${String(n).padStart(3, "0")}`;
        const sectionId = uid("sec");
        const survey: Survey = {
          id: uid("surv").toLowerCase(),
          code,
          ownerId: stateRef.current.sessionUserId ?? "",
          title: "",
          description: "",
          purpose: "",
          instructions: "",
          topic: "",
          audience: "",
          status: "draft",
          version: 1,
          versions: [{ versionNo: 1, publishedAt: null, lockedAt: null, questionCount: 0 }],
          sections: [{ id: sectionId, title: "Bagian 1", description: "" }],
          questions: [],
          token: uid("s").toLowerCase(),
          allowStandalone: true,
          allowIntegrated: false,
          consentVersion: "PRIV-2026.1",
          createdAt: now(),
          updatedAt: now(),
        };
        setState((s) => ({ ...s, surveys: [survey, ...s.surveys] }));
        log({ action: "survey.create", objectType: "survey", objectId: survey.id, detail: `Membuat draf ${code}` });
        return survey;
      },
      updateSurvey,
      setStatus(id, status) {
        const s = stateRef.current.surveys.find((x) => x.id === id);
        updateSurvey(id, (x) => ({ ...x, status }));
        const action =
          status === "closed" ? "survey.close" : status === "archived" ? "survey.archive" : s?.status === "archived" ? "survey.restore" : "survey.reopen";
        log({ action, objectType: "survey", objectId: id, detail: `${s?.code}: status menjadi ${status}` });
      },
      publish(id) {
        updateSurvey(id, (x) => ({
          ...x,
          status: "published",
          versions: x.versions.map((v) =>
            v.versionNo === x.version ? { ...v, publishedAt: now(), questionCount: x.questions.length } : v,
          ),
        }));
        const s = stateRef.current.surveys.find((x) => x.id === id);
        log({ action: "survey.publish", objectType: "survey", objectId: id, detail: `Memublikasikan ${s?.code} versi ${s?.version}` });
      },
      newVersion(id) {
        updateSurvey(id, (x) => ({
          ...x,
          status: "draft",
          version: x.version + 1,
          versions: [
            ...x.versions.map((v) => (v.versionNo === x.version ? { ...v, lockedAt: v.lockedAt ?? now() } : v)),
            { versionNo: x.version + 1, publishedAt: null, lockedAt: null, questionCount: x.questions.length },
          ],
        }));
        const s = stateRef.current.surveys.find((x) => x.id === id);
        log({ action: "survey.new_version", objectType: "survey", objectId: id, detail: `Membuat ${s?.code} versi ${(s?.version ?? 0) + 1}` });
      },
      duplicate(id) {
        const src = stateRef.current.surveys.find((x) => x.id === id);
        if (!src) return null;
        const n = stateRef.current.surveys.length + 1;
        const copy: Survey = {
          ...structuredClone(src),
          id: uid("surv").toLowerCase(),
          code: `SURV-${String(n).padStart(3, "0")}`,
          ownerId: stateRef.current.sessionUserId ?? src.ownerId,
          title: `Salinan ${src.title}`,
          status: "draft",
          version: 1,
          versions: [{ versionNo: 1, publishedAt: null, lockedAt: null, questionCount: src.questions.length }],
          token: uid("s").toLowerCase(),
          createdAt: now(),
          updatedAt: now(),
        };
        setState((s) => ({ ...s, surveys: [copy, ...s.surveys] }));
        log({ action: "survey.duplicate", objectType: "survey", objectId: copy.id, detail: `Menyalin ${src.code} menjadi ${copy.code}` });
        return copy;
      },
      submitResponse(token, draft) {
        const { surveys, responses } = stateRef.current;
        const survey = surveys.find((x) => x.token === token);
        if (!survey) return { ok: false, reason: "not_found" };
        // NFR-04: same key + same payload returns the same receipt.
        const prior = responses.find((r) => r.idempotencyKey === draft.idempotencyKey);
        if (prior) {
          return JSON.stringify(prior.answers) === JSON.stringify(draft.answers)
            ? { ok: true, response: prior, replayed: true }
            : { ok: false, reason: "conflict" };
        }
        if (survey.status !== "published") return { ok: false, reason: "not_open" };
        const count = responses.filter((r) => r.surveyId === survey.id).length + 1;
        const response: SurveyResponse = {
          ...draft,
          id: `${survey.code}-R${String(count).padStart(3, "0")}`,
          surveyId: survey.id,
          versionNo: survey.version,
          submittedAt: now(),
        };
        setState((s) => ({
          ...s,
          responses: [...s.responses, response],
          surveys: s.surveys.map((x) =>
            x.id === survey.id
              ? { ...x, versions: x.versions.map((v) => (v.versionNo === x.version ? { ...v, lockedAt: v.lockedAt ?? now() } : v)) }
              : x,
          ),
        }));
        return { ok: true, response, replayed: false };
      },
      log,
      resetDemo() {
        localStorage.removeItem(KEY);
        setState({ ...initialState(), sessionUserId: stateRef.current.sessionUserId });
      },
    };
  }, [state, hydrated, log, updateSurvey]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Responses for one survey, optionally limited to a version. */
export function useSurveyResponses(surveyId: string, version?: number) {
  const { responses } = useStore();
  return useMemo(
    () => responses.filter((r) => r.surveyId === surveyId && (version === undefined || r.versionNo === version)),
    [responses, surveyId, version],
  );
}
