"use client";
import { useState } from "react";
import { conceptsApi } from "../../lib/api";
import type { AnyCriterion, ICDConcept, LabConcept, DrugConcept } from "../../lib/types";

type Props = {
  onAdd: (criterion: AnyCriterion) => void;
};

type ActiveDomain = "diagnosis" | "lab" | "prescription";

export default function ConceptBrowser({ onAdd }: Props) {
  const [domain, setDomain] = useState<ActiveDomain>("diagnosis");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ICDConcept[] | LabConcept[] | DrugConcept[]>([]);
  const [searching, setSearching] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      if (domain === "diagnosis") {
        setResults(await conceptsApi.searchICD(query));
      } else if (domain === "lab") {
        setResults(await conceptsApi.searchLabs(query));
      } else {
        setResults(await conceptsApi.searchDrugs(query));
      }
    } finally {
      setSearching(false);
    }
  }

  function addICD(row: ICDConcept) {
    onAdd({
      domain: "diagnosis",
      label: `${row.icd_code} – ${row.disease_name}`,
      icd_codes: [row.icd_code],
    });
  }

  function addLab(row: LabConcept) {
    onAdd({
      domain: "lab",
      label: `Lab: ${row.test_name}`,
      test_codes: [row.test_code],
    });
  }

  function addDrug(row: DrugConcept) {
    onAdd({
      domain: "prescription",
      label: `Drug: ${row.drug_name}`,
      drug_codes: [row.drug_code],
    });
  }

  const DOMAINS: { id: ActiveDomain; label: string }[] = [
    { id: "diagnosis",    label: "Diagnosis (ICD)" },
    { id: "lab",         label: "Lab Test" },
    { id: "prescription", label: "Medication" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Domain tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => { setDomain(d.id); setResults([]); setQuery(""); }}
            className={`flex-1 py-1 text-sm rounded-md font-medium transition-colors ${
              domain === d.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={
            domain === "diagnosis"
              ? "Search ICD code or disease name…"
              : domain === "lab"
              ? "Search test code or name…"
              : "Search drug name or code…"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button
          onClick={search}
          disabled={searching}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border rounded-lg">
        {results.length === 0 && (
          <p className="p-3 text-sm text-gray-400 text-center">
            {query ? "No results" : "Search to browse concepts"}
          </p>
        )}

        {domain === "diagnosis" &&
          (results as ICDConcept[]).map((row) => (
            <div
              key={row.icd_code}
              className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => addICD(row)}
            >
              <div>
                <span className="font-mono text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-2">
                  {row.icd_code}
                </span>
                <span className="text-sm">{row.disease_name}</span>
              </div>
              <span className="text-xs text-gray-400 ml-2 shrink-0">
                n={row.patient_count.toLocaleString()}
              </span>
            </div>
          ))}

        {domain === "lab" &&
          (results as LabConcept[]).map((row) => (
            <div
              key={row.test_code}
              className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => addLab(row)}
            >
              <div>
                <span className="font-mono text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded mr-2">
                  {row.test_code}
                </span>
                <span className="text-sm">{row.test_name}</span>
                {row.result_unit && (
                  <span className="text-xs text-gray-400 ml-1">({row.result_unit})</span>
                )}
              </div>
              <span className="text-xs text-gray-400 ml-2 shrink-0">
                n={row.patient_count.toLocaleString()}
              </span>
            </div>
          ))}

        {domain === "prescription" &&
          (results as DrugConcept[]).map((row) => (
            <div
              key={row.drug_code}
              className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => addDrug(row)}
            >
              <div>
                <span className="font-mono text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded mr-2">
                  {row.drug_code}
                </span>
                <span className="text-sm">{row.drug_name}</span>
              </div>
              <span className="text-xs text-gray-400 ml-2 shrink-0">
                n={row.patient_count.toLocaleString()}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
