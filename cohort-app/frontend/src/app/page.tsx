"use client";
import { useState, useEffect } from "react";
import { useCohortStore } from "../store/cohortStore";
import { cohortsApi } from "../lib/api";
import type { AnyCriterion, SavedCohort } from "../lib/types";
import CriteriaSection from "../components/builder/CriteriaSection";
import FeasibilityBar from "../components/builder/FeasibilityBar";
import SearchDrawer from "../components/search/SearchDrawer";

type View = "dashboard" | "builder";
type AddTarget = "include" | "exclude";

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<AddTarget>("include");
  const store = useCohortStore();

  function openDrawer(target: AddTarget) {
    setAddTarget(target);
    setDrawerOpen(true);
  }

  function handleAdd(criterion: AnyCriterion) {
    if (addTarget === "include") store.addIncludeCriterion(criterion);
    else store.addExcludeCriterion(criterion);
    setDrawerOpen(false);
  }

  function startNewCohort() {
    store.reset();
    setView("builder");
  }

  async function loadCohort(id: string) {
    const def = await cohortsApi.get(id);
    store.loadDefinition(def);
    setView("builder");
  }

  if (view === "dashboard") {
    return <Dashboard onNew={startNewCohort} onLoad={loadCohort} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-30 h-14">
        <button
          onClick={() => setView("dashboard")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          My Cohorts
        </button>

        <svg className="w-4 h-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>

        {/* Inline editable cohort name */}
        <input
          className="font-semibold text-slate-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white rounded-lg px-2 py-1 text-sm min-w-[200px] max-w-sm"
          value={store.name}
          onChange={(e) => store.setName(e.target.value)}
          placeholder="Cohort name"
        />

        <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
          {store.include.criteria.length > 0 && (
            <span>
              <span className="font-semibold text-emerald-700">{store.include.criteria.length}</span> inclusion
            </span>
          )}
          {store.exclude.criteria.length > 0 && (
            <span>
              <span className="font-semibold text-rose-600">{store.exclude.criteria.length}</span> exclusion
            </span>
          )}
        </div>
      </header>

      {/* Builder workspace */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-8 gap-6">

        {/* Research question field */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Research question / notes
          </label>
          <textarea
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white shadow-sm"
            rows={2}
            value={store.description}
            onChange={(e) => store.setDescription(e.target.value)}
            placeholder="Describe the research question this cohort answers…"
          />
        </div>

        {/* Inclusion criteria */}
        <CriteriaSection
          type="include"
          criteria={store.include.criteria as AnyCriterion[]}
          operator={store.include.operator}
          onOperatorChange={store.setIncludeOperator}
          onRemove={store.removeIncludeCriterion}
          onAdd={() => openDrawer("include")}
        />

        {/* Exclusion criteria */}
        <CriteriaSection
          type="exclude"
          criteria={store.exclude.criteria as AnyCriterion[]}
          operator={store.exclude.operator}
          onOperatorChange={store.setExcludeOperator}
          onRemove={store.removeExcludeCriterion}
          onAdd={() => openDrawer("exclude")}
        />

        {/* Bottom spacer so sticky bar doesn't overlap content */}
        <div className="h-4" />
      </main>

      {/* Sticky feasibility bar */}
      <div className="sticky bottom-0 z-30">
        <FeasibilityBar />
      </div>

      {/* Search drawer (slide-over) */}
      <SearchDrawer
        open={drawerOpen}
        target={addTarget}
        onAdd={handleAdd}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({
  onNew,
  onLoad,
}: {
  onNew: () => void;
  onLoad: (id: string) => void;
}) {
  const [cohorts, setCohorts] = useState<SavedCohort[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    cohortsApi
      .list()
      .then(setCohorts)
      .catch(() => setCohorts([]))
      .finally(() => setLoadingList(false));
  }, []);

  async function handleLoad(id: string) {
    setLoadingId(id);
    try {
      await onLoad(id);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Siriraj Cohort Discovery</h1>
              <p className="text-xs text-slate-500">Clinical feasibility for researchers</p>
            </div>
          </div>

          <button
            onClick={onNew}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Cohort
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10">

        {/* Hero — shown when no cohorts exist */}
        {!loadingList && cohorts.length === 0 && (
          <div className="text-center py-20 mb-10 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold text-base mb-1">No cohorts yet</p>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
              Build a cohort to count how many patients match your research criteria
            </p>
            <button
              onClick={onNew}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Build your first cohort
            </button>
          </div>
        )}

        {/* Cohort list */}
        {(loadingList || cohorts.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 text-sm">Saved cohorts</h2>
              {!loadingList && (
                <span className="text-xs text-slate-400">{cohorts.length} cohort{cohorts.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Skeletons while loading */}
              {loadingList &&
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[72px] bg-white rounded-2xl border border-slate-200 animate-pulse"
                  />
                ))}

              {/* Cohort cards */}
              {!loadingList &&
                cohorts.map((cohort) => (
                  <button
                    key={cohort.id}
                    onClick={() => handleLoad(cohort.id)}
                    disabled={loadingId === cohort.id}
                    className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left group disabled:opacity-60"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{cohort.name}</p>
                      {cohort.description ? (
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{cohort.description}</p>
                      ) : (
                        <p className="text-slate-400 text-xs mt-0.5 italic">No description</p>
                      )}
                    </div>

                    {/* Chevron */}
                    {loadingId === cohort.id ? (
                      <svg className="w-4 h-4 text-slate-400 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* How it works — shown alongside cohorts as a guide */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Define population",
              desc: "Add diagnoses, labs, or medications your target patients must have",
            },
            {
              step: "2",
              title: "Narrow with exclusions",
              desc: "Exclude patients who don't fit your study criteria",
            },
            {
              step: "3",
              title: "Check feasibility",
              desc: "Run a count to see how many patients match and review the SQL",
            },
          ].map((item) => (
            <div key={item.step} className="p-4 bg-white rounded-2xl border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                <span className="text-xs font-bold text-blue-600">{item.step}</span>
              </div>
              <p className="font-semibold text-slate-800 text-sm mb-1">{item.title}</p>
              <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
