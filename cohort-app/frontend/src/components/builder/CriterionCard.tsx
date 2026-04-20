"use client";
import type { AnyCriterion } from "../../lib/types";

const DOMAIN_CONFIG: Record<string, { badge: string; bg: string; text: string }> = {
  diagnosis:    { badge: "Dx",   bg: "bg-blue-50",    text: "text-blue-700" },
  lab:          { badge: "Lab",  bg: "bg-emerald-50", text: "text-emerald-700" },
  prescription: { badge: "Rx",   bg: "bg-violet-50",  text: "text-violet-700" },
  demographics: { badge: "Demo", bg: "bg-amber-50",   text: "text-amber-700" },
  opd_visit:    { badge: "OPD",  bg: "bg-orange-50",  text: "text-orange-700" },
  ipd_admission:{ badge: "IPD",  bg: "bg-rose-50",    text: "text-rose-700" },
};

type Props = {
  criterion: AnyCriterion;
  onRemove: () => void;
};

export default function CriterionCard({ criterion, onRemove }: Props) {
  const config = DOMAIN_CONFIG[criterion.domain] ?? {
    badge: "?", bg: "bg-slate-50", text: "text-slate-700",
  };
  const label = criterion.label ?? criterion.domain;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm group hover:border-slate-300 hover:shadow transition-all">
      <span className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${config.bg} ${config.text}`}>
        {config.badge}
      </span>
      <span className="flex-1 text-sm text-slate-800 min-w-0 truncate">{label}</span>
      <button
        onClick={onRemove}
        aria-label="Remove criterion"
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
