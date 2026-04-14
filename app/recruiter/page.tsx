"use client";

import Link from "next/link";
import Sidebar from "../components/recruiter/Sidebar";
import Header from "../components/recruiter/Header";

import { useEffect, useState } from "react";

type DashboardMetrics = {
  totalInvites: number;
  completionRate: number;
  avgTimeToReportMs: number;
  sttFallbackRate: number;
  avgConfidence: number;
};

type Session = {
  id: string;
  status: string;
  createdAt: string;
  candidate: {
    name: string;
    email: string;
  };
  finalReport?: {
    recommendation: string;
    overallScore: number;
  } | null;
  recruiterDecision?: {
    decision: string;
    notes?: string | null;
  } | null;
};

export default function RecruiterDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      try {
        const [sessionsRes, metricsRes] = await Promise.all([
          fetch(`/api/recruiter/interviews?skip=${skip}&take=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`),
          fetch("/api/admin/metrics")
        ]);

        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSessions(data.sessions);
          setTotalSessions(data.total);
        }
        
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentPage, searchQuery]);

  const totalPages = Math.ceil(totalSessions / itemsPerPage);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-tertiary/10 text-tertiary";
      case "IN_PROGRESS": return "bg-secondary/10 text-secondary";
      case "NEEDS_CANDIDATE_RETRY": return "bg-error/10 text-error";
      case "NEEDS_HUMAN_REVIEW": return "bg-warning/10 text-warning";
      case "ABANDONED": return "bg-surface-container-highest text-on-surface-variant";
      default: return "bg-primary-container text-on-primary-fixed";
    }
  };

  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case "MOVE_FORWARD": return "text-tertiary";
      case "DECLINE": return "text-error";
      case "HOLD": return "text-secondary";
      case "NEEDS_REVIEW": return "text-warning";
      default: return "text-on-surface-variant";
    }
  };

  const getDecisionBadge = (decision?: string) => {
    if (!decision) return "";
    switch (decision) {
      case "MOVE_FORWARD": return "bg-tertiary text-white";
      case "DECLINE": return "bg-error text-white";
      case "HOLD": return "bg-secondary text-white";
      case "NEEDS_REVIEW": return "bg-tertiary/20 text-tertiary border border-tertiary/20";
      default: return "bg-surface-container-highest text-on-surface-variant";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <header className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-on-secondary-fixed tracking-tight mb-1">Recruitment Overview</h1>
            <p className="text-on-surface-variant font-medium text-sm md:text-base">Monitoring AI-driven candidate assessment performance.</p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl flex flex-col gap-4 group hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-outline-variant/10">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><span className="material-symbols-outlined">send</span></div>
                  </div>
                  <div>
                    <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Total Invites</p>
                    <p className="text-4xl font-black text-on-surface mt-1">{metrics?.totalInvites.toLocaleString() || "0"}</p>
                  </div>
                  <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden"><div className="h-full bg-primary w-full" /></div>
                </div>
                
                <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl flex flex-col gap-4 group hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-outline-variant/10">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-tertiary/10 rounded-2xl text-tertiary"><span className="material-symbols-outlined">task_alt</span></div>
                    <span className="text-tertiary text-sm font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check</span> {Math.round((metrics?.completionRate || 0) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Completion Rate</p>
                    <p className="text-4xl font-black text-on-surface mt-1">{Math.round((metrics?.completionRate || 0) * 100)}%</p>
                  </div>
                  <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary" style={{ width: `${(metrics?.completionRate || 0) * 100}%` }} />
                  </div>
                </div>

                <div className="bg-on-secondary-fixed p-6 md:p-8 rounded-3xl flex flex-col gap-4 text-white relative overflow-hidden hover:shadow-xl transition-all duration-500 sm:col-span-2 lg:col-span-1 border border-transparent">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                  <div className="flex justify-between items-start relative z-10">
                    <div className="p-3 bg-white/10 rounded-2xl"><span className="material-symbols-outlined">speed</span></div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Avg Confidence</p>
                    <p className="text-4xl font-black mt-1">{Math.round((metrics?.avgConfidence || 0) * 100)}%</p>
                  </div>
                  <p className="text-white/40 text-xs mt-auto italic">AI alignment across evaluations</p>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/5">
                <div className="p-6 md:p-8 border-b border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                  <h3 className="text-xl font-bold text-on-surface">Recent Candidates</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                      <input 
                        type="text" 
                        placeholder="Search candidates..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[640px]">
                    <thead className="bg-surface-container-low/50">
                      <tr>
                        <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Candidate</th>
                        <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Date</th>
                        <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                        <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Match Score</th>
                        <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="px-6 md:px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                                {s.candidate.name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-on-surface">{s.candidate.name}</p>
                                <p className="text-xs text-on-surface-variant">{s.candidate.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <span className="text-sm font-medium text-on-surface">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            {s.recruiterDecision ? (
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest ${getDecisionBadge(s.recruiterDecision.decision)}`}>
                                {s.recruiterDecision.decision.replace(/_/g, " ")}
                              </span>
                            ) : (
                              <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-tight ${getStatusClass(s.status)}`}>
                                {s.status.replace(/_/g, " ")}
                              </span>
                            )}
                          </td>
                          <td className="px-6 md:px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden min-w-[60px]">
                                {s.finalReport ? (
                                  <div className="h-full bg-tertiary" style={{ width: `${s.finalReport.overallScore * 20}%` }} />
                                ) : (
                                  <div className="h-full bg-primary/30 w-0" />
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`text-sm font-black ${getRecommendationColor(s.finalReport?.recommendation)}`}>
                                  {s.finalReport ? `${Math.round(s.finalReport.overallScore * 20)}%` : "--"}
                                </span>
                                {s.finalReport && (
                                  <span className="text-[8px] font-bold uppercase tracking-tighter text-on-surface-variant">
                                    AI: {s.finalReport.recommendation.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-5 text-right">
                            <Link href={`/recruiter/interviews/${s.id}`} className="p-2 text-secondary hover:text-primary transition-colors inline-flex">
                              <span className="material-symbols-outlined">visibility</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {sessions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 md:px-8 py-10 text-center text-on-surface-variant italic">
                            No candidates found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 md:p-6 bg-surface-container-low/20 border-t border-surface-container flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-xs font-medium text-on-surface-variant">
                    Showing {sessions.length} of {totalSessions} candidates
                  </p>
                  <div className="flex gap-1">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all font-bold text-xs ${currentPage === page ? 'bg-primary text-white' : 'hover:bg-surface-container-high'}`}
                      >
                        {page}
                      </button>
                    ))}

                    <button 
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="h-16" />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-surface-container p-4 flex justify-around items-center z-50">
        <Link href="/recruiter" className="flex flex-col items-center gap-1 text-primary"><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span><span className="text-[10px] font-bold">Dashboard</span></Link>
        <Link href="#" className="flex flex-col items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined">groups</span><span className="text-[10px] font-bold">Candidates</span></Link>
        <Link href="#" className="flex flex-col items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined">assignment</span><span className="text-[10px] font-bold">Assessments</span></Link>
        <Link href="#" className="flex flex-col items-center gap-1 text-on-surface-variant"><span className="material-symbols-outlined">person</span><span className="text-[10px] font-bold">Profile</span></Link>
      </nav>
    </div>
  );
}
