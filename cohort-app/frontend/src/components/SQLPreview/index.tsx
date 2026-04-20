"use client";
import { useCohortStore } from "../../store/cohortStore";

export default function SQLPreview() {
  const sql = useCohortStore((s) => s.generatedSQL);

  if (!sql) {
    return (
      <p className="text-sm text-gray-400 italic text-center py-6">
        Run a feasibility count to see the generated SQL.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Generated T-SQL
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(sql)}
          className="text-xs text-blue-600 hover:underline"
        >
          Copy
        </button>
      </div>
      <pre className="bg-gray-900 text-green-300 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
        {sql}
      </pre>
    </div>
  );
}
