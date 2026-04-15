"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/recruiter/Sidebar";
import Header from "../../components/recruiter/Header";

type LiveSession = {
  id: string;
  status: string;
  updatedAt: string;
  candidate: { name: string; email: string };
};

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch("/api/recruiter/interviews?take=50");
        const data = await res.json();
        // Filter for active statuses
        const active = data.sessions.filter((s: any) => 
          ["IN_PROGRESS", "CONSENTED", "READY_FOR_NEXT_QUESTION", "NEEDS_CANDIDATE_RETRY", "ANSWER_UPLOADED", "TRANSCRIBING", "EVALUATING", "FINALIZING"].includes(s.status)
        );
        setSessions(active);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLive();
    const interval = setInterval(fetchLive, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header onInviteClick={() => {}} />
        <main className="p-8">
          <header className="mb-10">
            <h1 className="text-4xl font-black text-on-secondary-fixed tracking-tight mb-2">Live Sessions</h1>
            <p className="text-on-surface-variant font-medium">Monitoring active candidate screenings in real-time.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(s => (
              <div key={s.id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {s.candidate.name[0]}
                  </div>
                  <span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] font-black rounded uppercase animate-pulse">
                    Live
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{s.candidate.name}</h3>
                  <p className="text-xs text-on-surface-variant">{s.candidate.email}</p>
                </div>
                <div className="pt-4 border-t border-outline-variant/5">
                  <p className="text-[10px] font-black uppercase text-on-surface-variant mb-1">Current Status</p>
                  <p className="text-sm font-bold text-primary">{s.status.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
            {sessions.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/20">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-2">person_search</span>
                <p className="text-on-surface-variant font-medium">No active sessions at the moment.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
