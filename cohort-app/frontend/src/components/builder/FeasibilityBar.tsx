"use client";
import { useState } from "react";
import { useCohortStore } from "../../store/cohortStore";
import { cohortsApi } from "../../lib/api";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function FeasibilityBar() {
  const store = useCohortStore();
  const [sqlOpen, setSqlOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const count = store.countResult?.count;
  const ms = store.countResult?.execution_time_ms;
  const hasCount = count !== undefined && count !== null;
  const dbOffline = count === -1;

  async function runCount() {
    store.setLoading(true);
    store.setCountResult(null);
    try {
      const def = store.getDefinition();
      const [countResult, sqlResult] = await Promise.all([
        cohortsApi.count(def),
        cohortsApi.generateSQL(def),
      ]);
      store.setCountResult(countResult);
      store.setGeneratedSQL(sqlResult.sql);
    } catch (err) {
      console.error(err);
    } finally {
      store.setLoading(false);
    }
  }

  async function save() {
    setSaveStatus("saving");
    try {
      await cohortsApi.save(store.getDefinition());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white shadow-[0_-1px_8px_0_rgb(0,0,0,0.06)]">
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Patient count */}
          <div className="flex items-baseline gap-2 min-w-[160px]">
            {store.isLoading ? (
              <div className="flex items-baseline gap-2">
                <div className="w-24 h-8 bg-slate-100 rounded-lg animate-pulse" />
                <div className="w-14 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : hasCount ? (
              <>
                <span className={`text-3xl font-bold tabular-nums ${dbOffline ? "text-slate-400" : "text-slate-900"}`}>
                  {dbOffline ? "N/A" : count!.toLocaleString()}
                </span>
                <span className="text-slate-500 text-sm">patients</span>
                {ms && !dbOffline && (
                  <span className="text-slate-400 text-xs">&middot; {ms.toFixed(0)} ms</span>
                )}
                {dbOffline && (
                  <span className="text-slate-400 text-xs">&middot; DB offline</span>
                )}
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-slate-200">—</span>
                <span className="text-slate-400 text-sm">run count to see results</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* SQL toggle */}
          {store.generatedSQL && (
            <button
              onClick={() => setSqlOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              View SQL
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${sqlOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}

          {/* Save */}
          <button
            onClick={save}
            disabled={saveStatus === "saving"}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              saveStatus === "saved"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : saveStatus === "error"
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
              ? "Saved ✓"
              : saveStatus === "error"
              ? "Error — retry"
              : "Save"}
          </button>

          {/* Run count */}
          <button
            onClick={runCount}
            disabled={store.isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-60 transition-colors"
          >
            {store.isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running…
              </>
            ) : (
              "Run Count"
            )}
          </button>
        </div>

        {/* SQL panel */}
        {sqlOpen && store.generatedSQL && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Generated T-SQL
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(store.generatedSQL)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Copy to clipboard
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-300 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-56">
              {store.generatedSQL}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
