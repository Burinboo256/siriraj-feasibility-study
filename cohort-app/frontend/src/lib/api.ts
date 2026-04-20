import type {
  CohortDefinition,
  CohortCountResponse,
  SavedCohort,
  Domain,
  ICDConcept,
  LabConcept,
  DrugConcept,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

// ── Cohorts ───────────────────────────────────────────────────────────────────

export const cohortsApi = {
  generateSQL: (definition: CohortDefinition) =>
    post<{ sql: string }>("/api/v1/cohorts/sql", { definition }),

  count: (definition: CohortDefinition) =>
    post<CohortCountResponse>("/api/v1/cohorts/count", { definition }),

  save: (definition: CohortDefinition) =>
    post<{ id: string; name: string }>("/api/v1/cohorts/save", definition),

  list: () => get<SavedCohort[]>("/api/v1/cohorts"),

  get: (id: string) => get<CohortDefinition>(`/api/v1/cohorts/${id}`),

  export: (id: string) =>
    get<{ definition: CohortDefinition; sql: string }>(`/api/v1/cohorts/${id}/export`),
};

// ── Concepts ──────────────────────────────────────────────────────────────────

export const conceptsApi = {
  domains: () => get<Domain[]>("/api/v1/concepts/domains"),

  searchICD: (q: string) =>
    get<ICDConcept[]>(`/api/v1/concepts/icd?q=${encodeURIComponent(q)}`),

  searchLabs: (q: string) =>
    get<LabConcept[]>(`/api/v1/concepts/labs?q=${encodeURIComponent(q)}`),

  searchDrugs: (q: string) =>
    get<DrugConcept[]>(`/api/v1/concepts/drugs?q=${encodeURIComponent(q)}`),
};

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadataApi = {
  tables: () => get<unknown[]>("/api/v1/metadata/tables"),
  table: (name: string) => get<unknown>(`/api/v1/metadata/tables/${name}`),
};
