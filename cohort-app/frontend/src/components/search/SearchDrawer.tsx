"use client";
import { useState, useEffect, useRef } from "react";
import { conceptsApi } from "../../lib/api";
import type { AnyCriterion, ICDConcept, LabConcept, DrugConcept } from "../../lib/types";

type SearchDomain = "diagnosis" | "lab" | "prescription";

const DOMAINS: {
  id: SearchDomain;
  label: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  hoverBg: string;
  hoverBorder: string;
  codeBg: string;
  codeText: string;
  plusColor: string;
  placeholder: string;
}[] = [
  {
    id: "diagnosis",
    label: "Diagnoses",
    badge: "Dx",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    hoverBg: "hover:bg-blue-50",
    hoverBorder: "hover:border-blue-100",
    codeBg: "bg-blue-50 border-blue-100",
    codeText: "text-blue-700",
    plusColor: "group-hover:text-blue-500",
    placeholder: "Search by diagnosis name or ICD code…",
  },
  {
    id: "lab",
    label: "Lab Tests",
    badge: "Lab",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    hoverBg: "hover:bg-emerald-50",
    hoverBorder: "hover:border-emerald-100",
    codeBg: "bg-emerald-50 border-emerald-100",
    codeText: "text-emerald-700",
    plusColor: "group-hover:text-emerald-500",
    placeholder: "Search by test name or code…",
  },
  {
    id: "prescription",
    label: "Medications",
    badge: "Rx",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
    hoverBg: "hover:bg-violet-50",
    hoverBorder: "hover:border-violet-100",
    codeBg: "bg-violet-50 border-violet-100",
    codeText: "text-violet-700",
    plusColor: "group-hover:text-violet-500",
    placeholder: "Search by medication name…",
  },
];

type Props = {
  open: boolean;
  target: "include" | "exclude";
  onAdd: (c: AnyCriterion) => void;
  onClose: () => void;
};

export default function SearchDrawer({ open, target, onAdd, onClose }: Props) {
  const [domain, setDomain] = useState<SearchDomain>("diagnosis");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(ICDConcept | LabConcept | DrugConcept)[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeDomain = DOMAINS.find((d) => d.id === domain)!;

  // Auto-focus & reset when drawer opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Debounced search on query/domain change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (domain === "diagnosis") setResults(await conceptsApi.searchICD(query));
        else if (domain === "lab") setResults(await conceptsApi.searchLabs(query));
        else setResults(await conceptsApi.searchDrugs(query));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, domain]);

  function addCriterion(row: ICDConcept | LabConcept | DrugConcept) {
    if (domain === "diagnosis") {
      const r = row as ICDConcept;
      onAdd({ domain: "diagnosis", label: r.disease_name, icd_codes: [r.icd_code] });
    } else if (domain === "lab") {
      const r = row as LabConcept;
      onAdd({ domain: "lab", label: r.test_name, test_codes: [r.test_code] });
    } else {
      const r = row as DrugConcept;
      onAdd({ domain: "prescription", label: r.drug_name, drug_codes: [r.drug_code] });
    }
  }

  function getCode(row: ICDConcept | LabConcept | DrugConcept): string {
    if ("icd_code" in row) return row.icd_code;
    if ("test_code" in row) return row.test_code;
    return (row as DrugConcept).drug_code;
  }

  function getName(row: ICDConcept | LabConcept | DrugConcept): string {
    if ("disease_name" in row) return row.disease_name;
    if ("test_name" in row) return row.test_name;
    return (row as DrugConcept).drug_name;
  }

  function getSubtitle(row: ICDConcept | LabConcept | DrugConcept): string {
    const count = row.patient_count.toLocaleString();
    if ("result_unit" in row && row.result_unit)
      return `${count} patients · ${row.result_unit}`;
    if ("drug_group_name" in row && row.drug_group_name)
      return `${count} patients · ${row.drug_group_name}`;
    return `${count} patients`;
  }

  const plusIcon = (
    <svg className={`w-4 h-4 text-slate-300 ${activeDomain.plusColor} shrink-0 transition-colors`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-slate-900 text-base">Add criteria</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-500">
            Adding to{" "}
            <span className={`font-semibold ${target === "include" ? "text-emerald-700" : "text-rose-600"}`}>
              {target === "include" ? "Include" : "Exclude"}
            </span>
          </p>
        </div>

        {/* Domain tabs */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDomain(d.id);
                  setQuery("");
                  setResults([]);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  domain === d.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="px-6 py-4 shrink-0">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeDomain.placeholder}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* Skeleton while loading */}
          {loading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[60px] bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && query.trim() && results.length === 0 && (
            <div className="text-center py-14">
              <p className="text-slate-600 text-sm font-medium">No results found</p>
              <p className="text-slate-400 text-xs mt-1">
                Try a different term or check the spelling
              </p>
            </div>
          )}

          {/* Empty / prompt to search */}
          {!loading && !query.trim() && (
            <div className="text-center py-14">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${activeDomain.badgeBg}`}>
                <span className={`text-base font-bold ${activeDomain.badgeText}`}>
                  {activeDomain.badge}
                </span>
              </div>
              <p className="text-slate-700 text-sm font-medium">Search {activeDomain.label}</p>
              <p className="text-slate-400 text-xs mt-1">
                Type above to find matching concepts
              </p>
            </div>
          )}

          {/* Result list */}
          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {results.map((row) => {
                const code = getCode(row);
                const name = getName(row);
                const subtitle = getSubtitle(row);
                return (
                  <button
                    key={code}
                    onClick={() => addCriterion(row)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left border border-transparent transition-all group ${activeDomain.hoverBg} ${activeDomain.hoverBorder}`}
                  >
                    <span
                      className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border shrink-0 ${activeDomain.codeBg} ${activeDomain.codeText}`}
                    >
                      {code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">{name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                    </div>
                    {plusIcon}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
