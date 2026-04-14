"use client";

import { useState, useEffect } from "react";

type Candidate = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  sessions: { id: string; status: string; createdAt: string }[];
};

export default function DataDeletionPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCandidates = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/candidates?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch candidates");
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCandidates(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleDelete = async (candidate: Candidate) => {
    if (!window.confirm(`WARNING: This will permanently delete ALL data (PII, audio, transcripts, evaluations) for ${candidate.name} (${candidate.email}). This action cannot be undone.\n\nAre you absolutely sure?`)) {
      return;
    }

    setDeletingId(candidate.id);
    setError("");

    try {
      const res = await fetch("/api/admin/data-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete candidate data");
      }

      // Remove from list
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete data");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-error mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl">delete_forever</span>
          Data Deletion (Compliance)
        </h1>
        <p className="text-on-surface-variant font-medium">
          Permanently remove candidate PII, audio recordings, and evaluation records to comply with GDPR and data privacy requests.
        </p>
      </header>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          <span className="font-bold">{error}</span>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="p-6 md:p-8 border-b border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold">Search Candidates</h2>
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-surface-container-low/50">
              <tr>
                <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Candidate</th>
                <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Created Date</th>
                <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Sessions</th>
                <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 md:px-8 py-10 text-center text-on-surface-variant italic">
                    <div className="flex justify-center py-4">
                      <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 md:px-8 py-10 text-center text-on-surface-variant italic">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-error/5 transition-colors">
                    <td className="px-6 md:px-8 py-5">
                      <p className="font-bold text-on-surface">{candidate.name}</p>
                      <p className="text-xs text-on-surface-variant">{candidate.email}</p>
                    </td>
                    <td className="px-6 md:px-8 py-5">
                      <span className="text-sm font-medium text-on-surface">
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-5">
                      <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-full">
                        {candidate.sessions.length} Session{candidate.sessions.length !== 1 && "s"}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-5 text-right">
                      <button
                        disabled={deletingId === candidate.id}
                        onClick={() => handleDelete(candidate)}
                        className="px-4 py-2 bg-error text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                      >
                        {deletingId === candidate.id ? (
                          <>
                            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Purge Data
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
