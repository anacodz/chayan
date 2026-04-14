"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/recruiter/Sidebar";
import Header from "../../components/recruiter/Header";

type QualityMetrics = {
  sttFallbackRate: number;
  avgConfidence: number;
  totalEvaluated: number;
};

export default function VoiceQualityPage() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);

  useEffect(() => {
    async function fetchQuality() {
      try {
        const res = await fetch("/api/admin/metrics");
        const data = await res.json();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchQuality();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8">
          <header className="mb-10">
            <h1 className="text-4xl font-black text-on-secondary-fixed tracking-tight mb-2">Voice & STT Quality</h1>
            <p className="text-on-surface-variant font-medium">Monitoring Speech-to-Text accuracy and model confidence.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <h3 className="text-lg font-bold mb-6 text-on-surface">STT Fallback Rate</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container-high" />
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={282.7} strokeDashoffset={282.7 * (1 - (metrics?.sttFallbackRate || 0))} strokeLinecap="round" className="text-error" />
                  </svg>
                  <span className="absolute text-2xl font-black text-error">{Math.round((metrics?.sttFallbackRate || 0) * 100)}%</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                    Percentage of sessions where primary STT failed and fallback logic was triggered.
                  </p>
                  <p className="text-xs text-on-surface-variant/60 italic mt-2">Target: &lt; 5%</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
              <h3 className="text-lg font-bold mb-6 text-on-surface">Average Model Confidence</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-surface-container-high" />
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={282.7} strokeDashoffset={282.7 * (1 - (metrics?.avgConfidence || 0))} strokeLinecap="round" className="text-tertiary" />
                  </svg>
                  <span className="absolute text-2xl font-black text-tertiary">{Math.round((metrics?.avgConfidence || 0) * 100)}%</span>
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                    AI confidence score across all automated evaluations in the last 30 days.
                  </p>
                  <p className="text-xs text-on-surface-variant/60 italic mt-2">Target: &gt; 85%</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
