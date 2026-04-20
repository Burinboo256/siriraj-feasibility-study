import { create } from "zustand";
import type { CohortDefinition, CriteriaGroup, AnyCriterion, CohortCountResponse } from "../lib/types";

const emptyGroup = (): CriteriaGroup => ({ operator: "AND", criteria: [] });

type CohortStore = {
  name: string;
  description: string;
  include: CriteriaGroup;
  exclude: CriteriaGroup;
  countResult: CohortCountResponse | null;
  generatedSQL: string;
  isLoading: boolean;

  setName: (name: string) => void;
  setDescription: (desc: string) => void;
  addIncludeCriterion: (c: AnyCriterion) => void;
  removeIncludeCriterion: (index: number) => void;
  addExcludeCriterion: (c: AnyCriterion) => void;
  removeExcludeCriterion: (index: number) => void;
  setIncludeOperator: (op: "AND" | "OR") => void;
  setExcludeOperator: (op: "AND" | "OR") => void;
  setCountResult: (r: CohortCountResponse | null) => void;
  setGeneratedSQL: (sql: string) => void;
  setLoading: (v: boolean) => void;
  getDefinition: () => CohortDefinition;
  reset: () => void;
  loadDefinition: (def: CohortDefinition) => void;
};

export const useCohortStore = create<CohortStore>((set, get) => ({
  name: "New Cohort",
  description: "",
  include: emptyGroup(),
  exclude: emptyGroup(),
  countResult: null,
  generatedSQL: "",
  isLoading: false,

  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),

  addIncludeCriterion: (c) =>
    set((s) => ({
      include: { ...s.include, criteria: [...s.include.criteria, c] },
    })),

  removeIncludeCriterion: (index) =>
    set((s) => ({
      include: {
        ...s.include,
        criteria: s.include.criteria.filter((_, i) => i !== index),
      },
    })),

  addExcludeCriterion: (c) =>
    set((s) => ({
      exclude: { ...s.exclude, criteria: [...s.exclude.criteria, c] },
    })),

  removeExcludeCriterion: (index) =>
    set((s) => ({
      exclude: {
        ...s.exclude,
        criteria: s.exclude.criteria.filter((_, i) => i !== index),
      },
    })),

  setIncludeOperator: (op) =>
    set((s) => ({ include: { ...s.include, operator: op } })),

  setExcludeOperator: (op) =>
    set((s) => ({ exclude: { ...s.exclude, operator: op } })),

  setCountResult: (countResult) => set({ countResult }),
  setGeneratedSQL: (generatedSQL) => set({ generatedSQL }),
  setLoading: (isLoading) => set({ isLoading }),

  getDefinition: (): CohortDefinition => {
    const { name, description, include, exclude } = get();
    return {
      name,
      description: description || undefined,
      include,
      exclude: exclude.criteria.length > 0 ? exclude : undefined,
    };
  },

  reset: () =>
    set({
      name: "New Cohort",
      description: "",
      include: emptyGroup(),
      exclude: emptyGroup(),
      countResult: null,
      generatedSQL: "",
      isLoading: false,
    }),

  loadDefinition: (def) =>
    set({
      name: def.name,
      description: def.description ?? "",
      include: def.include,
      exclude: def.exclude ?? emptyGroup(),
      countResult: null,
      generatedSQL: "",
    }),
}));
