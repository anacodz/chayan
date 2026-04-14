"use client";

import { useEffect, useState } from "react";

type CalibrationData = {
  id: string;
  promptVersion: string;
  model: string;
  score: number;
  humanCorrected: boolean;
  originalTranscript?: string;
  correctedTranscript?: string;
  question: string;
  createdAt: string;
};

export default function CalibrationDashboard() {
  const [data, setData] = useState<CalibrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/calibration");
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();
        setData(json.evaluations || []);
      } catch (err) {
        setError("Failed to load calibration data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-on-secondary-fixed tracking-tight mb-2">Calibration & Quality</h1>
        <p className="text-on-surface-variant font-medium text-sm md:text-base">Monitor AI scoring consistency and review prompt versions against human corrections.</p>
      </header>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-on-surface">Evaluation Samples</h2>
            <div className="text-xs font-bold bg-surface-container text-on-surface-variant px-3 py-1 rounded-full">
              {data.length} records
            </div>
          </div>
          
          <div className="space-y-6">
            {data.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No evaluation data available yet.</p>
            ) : (
              data.map((item) => (
                <div key={item.id} className="p-5 border border-outline-variant/20 rounded-xl space-y-4 hover:border-outline-variant/40 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{item.model} • {item.promptVersion}</p>
                      <p className="font-semibold text-on-surface text-sm">{item.question}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-surface-container-high px-3 py-1 rounded-lg text-sm font-black text-on-surface">
                        Score: {item.score}/5
                      </div>
                      {item.humanCorrected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-error uppercase tracking-tighter bg-error/10 px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Human Corrected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Original AI Transcript</p>
                      <p className="text-sm text-on-surface-variant bg-surface-container-low p-3 rounded-lg leading-relaxed">
                        &quot;{item.originalTranscript || "N/A"}&quot;
                      </p>
                    </div>
                    {item.humanCorrected && (
                      <div>
                        <p className="text-[10px] font-bold text-error uppercase tracking-widest mb-2">Recruiter Correction</p>
                        <p className="text-sm text-on-surface bg-error/5 p-3 rounded-lg leading-relaxed border border-error/10">
                          &quot;{item.correctedTranscript}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
