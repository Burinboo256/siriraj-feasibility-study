"use client";
import { useCohortStore } from "../../store/cohortStore";
import { cohortsApi } from "../../lib/api";

export default function FeasibilityPanel() {
  const store = useCohortStore();

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
    try {
      const result = await cohortsApi.save(store.getDefinition());
      alert(`Saved! Cohort ID: ${result.id}`);
    } catch {
      alert("Save failed.");
    }
  }

  const count = store.countResult?.count;
  const ms = store.countResult?.execution_time_ms;

  return (
    <div className="flex flex-col gap-4">
      {/* Count display */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white text-center">
        <p className="text-sm uppercase tracking-widest opacity-75 mb-1">Matching Patients</p>
        {store.isLoading ? (
          <div className="text-4xl font-bold animate-pulse">…</div>
        ) : count !== undefined && count !== null ? (
          <>
            <div className="text-5xl font-bold">
              {count === -1 ? "N/A" : count.toLocaleString()}
            </div>
            {ms && (
              <p className="text-xs opacity-60 mt-1">
                {count === -1 ? "DB not connected" : `${ms.toFixed(0)} ms`}
              </p>
            )}
          </>
        ) : (
          <div className="text-3xl font-bold opacity-40">—</div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={runCount}
          disabled={store.isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
        >
          {store.isLoading ? "Running…" : "Run Feasibility Count"}
        </button>
        <button
          onClick={save}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          Save
        </button>
      </div>

      {/* Criteria summary */}
      <div className="text-xs text-gray-500 border-t pt-3">
        <p>
          <span className="font-semibold text-green-700">
            {store.include.criteria.length}
          </span>{" "}
          include criteria ·{" "}
          <span className="font-semibold text-red-600">
            {store.exclude.criteria.length}
          </span>{" "}
          exclusions
        </p>
      </div>
    </div>
  );
}
