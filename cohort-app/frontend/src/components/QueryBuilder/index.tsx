"use client";
import { useCohortStore } from "../../store/cohortStore";
import type { AnyCriterion } from "../../lib/types";

const DOMAIN_COLORS: Record<string, string> = {
  diagnosis:    "bg-blue-100 text-blue-800 border-blue-200",
  lab:          "bg-green-100 text-green-800 border-green-200",
  prescription: "bg-purple-100 text-purple-800 border-purple-200",
  demographics: "bg-yellow-100 text-yellow-800 border-yellow-200",
  opd_visit:    "bg-orange-100 text-orange-800 border-orange-200",
  ipd_admission:"bg-red-100 text-red-800 border-red-200",
};

const DOMAIN_LABELS: Record<string, string> = {
  diagnosis:    "Dx",
  lab:          "Lab",
  prescription: "Rx",
  demographics: "Demo",
  opd_visit:    "OPD",
  ipd_admission:"IPD",
};

function CriterionChip({
  criterion,
  onRemove,
}: {
  criterion: AnyCriterion;
  onRemove: () => void;
}) {
  const color = DOMAIN_COLORS[criterion.domain] ?? "bg-gray-100 text-gray-800";
  const domainLabel = DOMAIN_LABELS[criterion.domain] ?? criterion.domain;
  const label = criterion.label ?? criterion.domain;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${color}`}>
      <span className="font-bold uppercase text-xs">{domainLabel}</span>
      <span className="flex-1">{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 opacity-60 hover:opacity-100 font-bold leading-none"
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

function CriteriaSection({
  title,
  color,
  criteria,
  operator,
  onOperatorChange,
  onRemove,
}: {
  title: string;
  color: string;
  criteria: AnyCriterion[];
  operator: "AND" | "OR";
  onOperatorChange: (op: "AND" | "OR") => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className={`border-l-4 pl-4 py-2 ${color}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="font-semibold text-sm">{title}</span>
        <div className="flex gap-1">
          {(["AND", "OR"] as const).map((op) => (
            <button
              key={op}
              onClick={() => onOperatorChange(op)}
              className={`px-2 py-0.5 text-xs rounded font-mono ${
                operator === op
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {criteria.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No criteria added yet</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-xs font-mono text-gray-400 w-8 text-right shrink-0">
                  {operator}
                </span>
              )}
              <div className="flex-1">
                <CriterionChip criterion={c} onRemove={() => onRemove(i)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QueryBuilder() {
  const store = useCohortStore();
  const includeCriteria = store.include.criteria as AnyCriterion[];
  const excludeCriteria = store.exclude.criteria as AnyCriterion[];

  return (
    <div className="flex flex-col gap-4">
      {/* Cohort metadata */}
      <div className="flex flex-col gap-2">
        <input
          className="border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={store.name}
          onChange={(e) => store.setName(e.target.value)}
          placeholder="Cohort name"
        />
        <textarea
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
          value={store.description}
          onChange={(e) => store.setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
      </div>

      {/* INCLUDE */}
      <CriteriaSection
        title="INCLUDE patients who match:"
        color="border-green-500"
        criteria={includeCriteria}
        operator={store.include.operator}
        onOperatorChange={store.setIncludeOperator}
        onRemove={store.removeIncludeCriterion}
      />

      {/* EXCLUDE */}
      <CriteriaSection
        title="EXCLUDE patients who match:"
        color="border-red-400"
        criteria={excludeCriteria}
        operator={store.exclude.operator}
        onOperatorChange={store.setExcludeOperator}
        onRemove={store.removeExcludeCriterion}
      />
    </div>
  );
}
