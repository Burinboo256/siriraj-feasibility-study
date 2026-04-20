"use client";
import type { AnyCriterion } from "../../lib/types";
import CriterionCard from "./CriterionCard";

type Props = {
  type: "include" | "exclude";
  criteria: AnyCriterion[];
  operator: "AND" | "OR";
  onOperatorChange: (op: "AND" | "OR") => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
};

export default function CriteriaSection({
  type,
  criteria,
  operator,
  onOperatorChange,
  onRemove,
  onAdd,
}: Props) {
  const isInclude = type === "include";

  return (
    <div
      className={`rounded-2xl border-2 p-5 transition-colors ${
        isInclude
          ? "border-emerald-100 bg-emerald-50/30"
          : "border-rose-100 bg-rose-50/20"
      }`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isInclude ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <h3 className="font-semibold text-slate-800 text-sm">
            {isInclude ? "Include patients who match" : "Exclude patients who match"}
          </h3>
        </div>

        {/* AND / OR toggle — only shown when >1 criterion */}
        {criteria.length > 1 && (
          <div className="flex items-center gap-0.5 p-1 bg-white rounded-lg border border-slate-200 shadow-sm">
            {(["AND", "OR"] as const).map((op) => (
              <button
                key={op}
                onClick={() => onOperatorChange(op)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  operator === op
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {criteria.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-slate-500 text-sm">
            {isInclude ? "No inclusion criteria yet" : "No exclusion criteria yet"}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            {isInclude
              ? "Add filters to define your target population"
              : "Optionally exclude patients matching certain conditions"}
          </p>
        </div>
      )}

      {/* Criteria list */}
      {criteria.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {criteria.map((c, i) => (
            <div key={i}>
              {i > 0 && (
                <div className="flex items-center gap-2 my-1.5 px-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    {operator}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              <CriterionCard criterion={c} onRemove={() => onRemove(i)} />
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={onAdd}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition-all ${
          isInclude
            ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            : "border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        {isInclude ? "Add inclusion criteria" : "Add exclusion criteria"}
      </button>
    </div>
  );
}
