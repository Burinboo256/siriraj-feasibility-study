"use client";
import { useState } from "react";
import QueryBuilder from "../components/QueryBuilder";
import ConceptBrowser from "../components/ConceptBrowser";
import FeasibilityPanel from "../components/FeasibilityPanel";
import SQLPreview from "../components/SQLPreview";
import { useCohortStore } from "../store/cohortStore";
import type { AnyCriterion } from "../lib/types";

type AddTarget = "include" | "exclude";

export default function Home() {
  const store = useCohortStore();
  const [addTarget, setAddTarget] = useState<AddTarget>("include");

  function handleAdd(criterion: AnyCriterion) {
    if (addTarget === "include") {
      store.addIncludeCriterion(criterion);
    } else {
      store.addExcludeCriterion(criterion);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-blue-900">Siriraj Cohort Discovery</h1>
          <p className="text-xs text-gray-500">Clinical feasibility study builder</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={store.reset}
            className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded border hover:border-gray-400 transition-colors"
          >
            New Cohort
          </button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <main className="flex flex-1 gap-0 overflow-hidden">

        {/* LEFT — Concept Browser */}
        <aside className="w-80 shrink-0 bg-white border-r flex flex-col">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700">Concept Browser</h2>
            <p className="text-xs text-gray-400 mt-0.5">Search and add to your cohort</p>
          </div>
          <div className="px-4 py-3 border-b flex gap-2">
            <span className="text-xs text-gray-500 mr-1 pt-0.5">Add to:</span>
            {(["include", "exclude"] as AddTarget[]).map((t) => (
              <button
                key={t}
                onClick={() => setAddTarget(t)}
                className={`px-2 py-1 text-xs rounded font-semibold capitalize transition-colors ${
                  addTarget === t
                    ? t === "include"
                      ? "bg-green-600 text-white"
                      : "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ConceptBrowser onAdd={handleAdd} />
          </div>
        </aside>

        {/* CENTER — Query Builder */}
        <section className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 min-w-0">
          <QueryBuilder />
          <SQLPreview />
        </section>

        {/* RIGHT — Feasibility Panel */}
        <aside className="w-72 shrink-0 bg-white border-l p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm text-gray-700">Feasibility</h2>
          <FeasibilityPanel />

          {/* Saved Cohorts placeholder */}
          <div className="border-t pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Saved Cohorts
            </h3>
            <SavedCohortsList />
          </div>
        </aside>
      </main>
    </div>
  );
}

function SavedCohortsList() {
  const store = useCohortStore();
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const { cohortsApi } = await import("../lib/api");
    setCohorts(await cohortsApi.list());
    setLoaded(true);
  }

  if (!loaded) {
    return (
      <button onClick={load} className="text-xs text-blue-600 hover:underline">
        Load saved cohorts
      </button>
    );
  }

  if (cohorts.length === 0) {
    return <p className="text-xs text-gray-400 italic">No saved cohorts yet.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {cohorts.map((c) => (
        <button
          key={c.id}
          onClick={async () => {
            const { cohortsApi } = await import("../lib/api");
            const def = await cohortsApi.get(c.id);
            store.loadDefinition(def);
          }}
          className="text-left text-xs px-2 py-1.5 rounded hover:bg-blue-50 text-blue-700 truncate"
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
