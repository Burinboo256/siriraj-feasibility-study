"use client";
import { useState, useEffect, useRef } from "react";
import { conceptsApi } from "../../lib/api";
import type { AnyCriterion, ICDConcept, LabConcept, DrugConcept } from "../../lib/types";

type SearchDomain = "diagnosis" | "lab" | "prescription";

const DOMAINS = [
  {
    id: "diagnosis" as SearchDomain,
    label: "Diagnoses",
    badge: "Dx",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    hoverBg: "hover:bg-blue-50",
    hoverBorder: "hover:border-blue-100",
    codeBg: "bg-blue-50 border-blue-100",
    codeText: "text-blue-700",
    plusHover: "group-hover:text-blue-500",
    placeholder: "Search by diagnosis name or ICD code…",
  },
  {
    id: "lab" as SearchDomain,
    label: "Lab Tests",
    badge: "Lab",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    hoverBg: "hover:bg-emerald-50",
    hoverBorder: "hover:border-emerald-100",
    codeBg: "bg-emerald-50 border-emerald-100",
    codeText: "text-emerald-700",
    plusHover: "group-hover:text-emerald-500",
    placeholder: "Search by test name or code…",
  },
  {
    id: "prescription" as SearchDomain,
    label: "Medications",
    badge: "Rx",
    badgeBg: "bg-violet-50",
    badgeText: "text-violet-700",
    hoverBg: "hover:bg-violet-50",
    hoverBorder: "hover:border-violet-100",
    codeBg: "bg-violet-50 border-violet-100",
    codeText: "text-violet-700",
    plusHover: "group-hover:text-violet-500",
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
  const d = DOMAINS.find((x) => x.id === domain)!;

  // Auto-focus + reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
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
    return () => clearTimeout(t);
  }, [query, domain]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
    const n = row.patient_count.toLocaleString();
    if ("result_unit" in row && row.result_unit) return `${n} patients · ${row.result_unit}`;
    if ("drug_group_name" in row && row.drug_group_name) return `${n} patients · ${row.drug_group_name}`;
    return `${n} patients`;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/25 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-slate-900">Add criteria</h2>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
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
        <div className="shrink-0 px-5 pt-4">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {DOMAINS.map((x) => (
              <button
                key={x.id}
                onClick={() => { setDomain(x.id); setQuery(""); setResults([]); setTimeout(() => inputRef.current?.focus(), 50); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${domain === x.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="shrink-0 px-5 py-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={d.placeholder}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
            />
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">

          {/* Loading skeletons */}
          {loading && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && query.trim() !== "" && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-sm font-medium">No results found</p>
              <p className="text-slate-400 text-xs mt-1">Try a different term or check spelling</p>
            </div>
          )}

          {/* Prompt to search */}
          {!loading && query.trim() === "" && (
            <div className="text-center py-12">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${d.badgeBg}`}>
                <span className={`text-xs font-bold ${d.badgeText}`}>{d.badge}</span>
              </div>
              <p className="text-slate-700 text-sm font-medium">Search {d.label}</p>
              <p className="text-slate-400 text-xs mt-1">Type above to find matching concepts</p>
            </div>
          )}

          {/* Results list */}
          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-1">
              {results.map((row) => {
                const code = getCode(row);
                return (
                  <button
                    key={code}
                    onClick={() => addCriterion(row)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left border border-transparent transition-all group ${d.hoverBg} ${d.hoverBorder}`}
                  >
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border shrink-0 ${d.codeBg} ${d.codeText}`}>
                      {code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">{getName(row)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{getSubtitle(row)}</p>
                    </div>
                    <svg className={`w-4 h-4 text-slate-300 ${d.plusHover} shrink-0 transition-colors`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
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
