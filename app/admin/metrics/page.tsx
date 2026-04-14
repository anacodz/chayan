"use client";

import { useEffect, useState } from "react";

type DashboardMetrics = {
  totalInvites: number;
  completionRate: number;
  avgTimeToReportMs: number;
  sttFallbackRate: number;
  avgConfidence: number;
  funnel: {
    invited: number;
    started: number;
    completed: number;
    reviewed: number;
  };
};

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        throw new Error("Failed to load metrics");
      }
    } catch (err) {
      setError("Failed to load metrics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-2xl">
        <p className="font-bold">{error || "Something went wrong"}</p>
      </div>
    );
  }

  const funnelData = [
    { label: "Invited", value: metrics.funnel.invited, color: "bg-outline-variant/20" },
    { label: "Started", value: metrics.funnel.started, color: "bg-primary/40" },
    { label: "Completed", value: metrics.funnel.completed, color: "bg-primary" },
    { label: "Reviewed", value: metrics.funnel.reviewed, color: "bg-tertiary" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-on-secondary-fixed mb-2">System Metrics</h1>
          <p className="text-on-surface-variant font-medium">Monitoring platform health and AI pipeline efficiency.</p>
        </div>
        <button 
          onClick={fetchMetrics}
          className="px-4 py-2 bg-surface-container-high text-primary font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </header>

      {/* Conversion Funnel */}
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/5">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-8">Candidate Conversion Funnel</h3>
        <div className="flex flex-col md:flex-row items-end gap-1 min-h-[200px]">
          {funnelData.map((stage, i) => {
            const height = metrics.funnel.invited > 0 ? (stage.value / metrics.funnel.invited) * 100 : 0;
            return (
              <div key={stage.label} className="flex-1 flex flex-col items-center gap-4 w-full">
                <div className="w-full flex flex-col justify-end items-center flex-1">
                   <div 
                    className={`w-full rounded-t-2xl transition-all duration-700 ${stage.color}`} 
                    style={{ height: `${Math.max(height, 5)}%` }}
                   >
                     <div className="p-4 text-center">
                        <p className="text-xl font-black text-on-surface">{stage.value}</p>
                     </div>
                   </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-tighter">{stage.label}</p>
                  {i > 0 && stage.value > 0 && (
                    <p className="text-[10px] text-tertiary font-bold">
                      {Math.round((stage.value / funnelData[i-1].value) * 100)}% conv
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Core Funnel (Mini) */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <span className="material-symbols-outlined">analytics</span>
            </div>
          </div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Final Completion Rate</p>
          <p className="text-4xl font-black text-on-surface mt-1">{Math.round(metrics.completionRate * 100)}%</p>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase">
              <span>Invited vs Completed</span>
              <span>{metrics.funnel.completed} / {metrics.funnel.invited}</span>
            </div>
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${metrics.completionRate * 100}%` }} />
            </div>
          </div>
        </div>

        {/* AI Health */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-tertiary/10 rounded-2xl text-tertiary">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${metrics.avgConfidence > 0.8 ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>
              {metrics.avgConfidence > 0.8 ? 'High Alignment' : 'Moderate Alignment'}
            </span>
          </div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Avg AI Confidence</p>
          <p className="text-4xl font-black text-on-surface mt-1">{Math.round(metrics.avgConfidence * 100)}%</p>
          <p className="text-xs text-on-surface-variant mt-4 italic">Average confidence score across all automated evaluations.</p>
        </div>

        {/* Pipeline Efficiency */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
              <span className="material-symbols-outlined">timer</span>
            </div>
          </div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Avg Time to Report</p>
          <p className="text-4xl font-black text-on-surface mt-1">
            {metrics.avgTimeToReportMs > 0 ? formatDuration(metrics.avgTimeToReportMs) : "--"}
          </p>
          <p className="text-xs text-on-surface-variant mt-4 italic">Median time from session start to final report generation.</p>
        </div>

        {/* STT Reliability */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/5 md:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-error/10 rounded-2xl text-error">
              <span className="material-symbols-outlined">speech_to_text</span>
            </div>
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Provider: Sarvam Primary / Whisper Fallback</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">STT Fallback Rate</p>
              <p className="text-4xl font-black text-on-surface mt-1">{Math.round(metrics.sttFallbackRate * 100)}%</p>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-on-surface-variant">
                  <span>Sarvam (Primary)</span>
                  <span>{100 - Math.round(metrics.sttFallbackRate * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${100 - metrics.sttFallbackRate * 100}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-on-surface-variant">
                  <span>Whisper (Fallback)</span>
                  <span>{Math.round(metrics.sttFallbackRate * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-error" style={{ width: `${metrics.sttFallbackRate * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-6 italic border-t border-outline-variant/10 pt-4">
            Percentage of transcriptions that required a fallback to OpenAI Whisper due to primary provider failure or low confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
