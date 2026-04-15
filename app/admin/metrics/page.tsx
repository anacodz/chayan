"use client";

import { useEffect, useState } from "react";

type DashboardMetrics = {
  totalInvites: number;
  completionRate: number;
  avgTimeToReportMs: number;
  sttFallbackRate: number;
  avgConfidence: number;
  totalCostUSD: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  llmVoiceResponses: {
    total: number;
    evaluated: number;
    avgDurationSeconds: number;
    recent: Array<{
      answerId: string;
      sessionId: string;
      candidateName: string;
      questionPrompt: string;
      transcript: string;
      confidence: number;
      createdAt: string;
    }>;
  };
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatTokens = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toString();
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

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/5">
          <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest mb-1">Total Invites</p>
          <p className="text-3xl font-black text-on-surface">{metrics.totalInvites}</p>
          <p className="text-[10px] text-on-surface-variant mt-2">Active recruitment funnel</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/5">
          <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest mb-1">Completion Rate</p>
          <p className="text-3xl font-black text-on-surface">{Math.round(metrics.completionRate * 100)}%</p>
          <div className="w-full h-1 bg-surface-container-high rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${metrics.completionRate * 100}%` }} />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/5">
          <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest mb-1">Total Pipeline Cost</p>
          <p className="text-3xl font-black text-on-surface">{formatCurrency(metrics.totalCostUSD)}</p>
          <p className="text-[10px] text-on-surface-variant mt-2">Evaluation & report generation</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/5">
          <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-widest mb-1">Token Throughput</p>
          <p className="text-3xl font-black text-on-surface">{formatTokens(metrics.totalInputTokens + metrics.totalOutputTokens)}</p>
          <p className="text-[10px] text-on-surface-variant mt-2">Input: {formatTokens(metrics.totalInputTokens)} / Output: {formatTokens(metrics.totalOutputTokens)}</p>
        </div>
      </div>

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
                  {i > 0 && funnelData[i-1].value > 0 && (
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
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-error/10 rounded-2xl text-error">
              <span className="material-symbols-outlined">speech_to_text</span>
            </div>
          </div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">STT Fallback Rate</p>
          <p className="text-4xl font-black text-on-surface mt-1">{Math.round(metrics.sttFallbackRate * 100)}%</p>
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase text-on-surface-variant">
                <span>Sarvam (Primary)</span>
                <span>{100 - Math.round(metrics.sttFallbackRate * 100)}%</span>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${100 - metrics.sttFallbackRate * 100}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase text-on-surface-variant">
                <span>Whisper (Fallback)</span>
                <span>{Math.round(metrics.sttFallbackRate * 100)}%</span>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-error" style={{ width: `${metrics.sttFallbackRate * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Processing Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/5">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-6">Voice AI Pipeline</h3>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Total Responses</p>
                <p className="text-3xl font-black text-on-surface">{metrics.llmVoiceResponses.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">mic</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Evaluated by AI</p>
                <p className="text-3xl font-black text-on-surface">{metrics.llmVoiceResponses.evaluated}</p>
              </div>
              <div className="w-12 h-12 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">psychology</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Avg Response Duration</p>
                <p className="text-3xl font-black text-on-surface">{Math.round(metrics.llmVoiceResponses.avgDurationSeconds)}s</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">hourglass_empty</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/5">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-6">Recent AI Evaluations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="pb-4 text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Candidate</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Confidence</th>
                  <th className="pb-4 text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Transcript Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {metrics.llmVoiceResponses.recent.map((resp) => (
                  <tr key={resp.answerId} className="group">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-xs text-on-surface">{resp.candidateName}</p>
                      <p className="text-[10px] text-on-surface-variant">{new Date(resp.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${resp.confidence > 0.8 ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>
                        {Math.round(resp.confidence * 100)}%
                      </span>
                    </td>
                    <td className="py-4">
                      <p className="text-[10px] text-on-surface-variant line-clamp-2 max-w-md italic leading-relaxed">
                        "{resp.transcript}"
                      </p>
                    </td>
                  </tr>
                ))}
                {metrics.llmVoiceResponses.recent.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-xs text-on-surface-variant italic">
                      No voice responses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
