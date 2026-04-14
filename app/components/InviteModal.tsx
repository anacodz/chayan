"use client";

import { useEffect, useState } from "react";

interface QuestionSet {
  id: string;
  count: number;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export default function InviteModal({ isOpen, onClose, onSuccess }: InviteModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      async function fetchSets() {
        try {
          const res = await fetch("/api/admin/question-sets");
          if (res.ok) {
            const data = await res.json();
            setQuestionSets(data.sets);
          }
        } catch (err) {
          console.error("Failed to fetch question sets:", err);
        }
      }
      fetchSets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, questionSetId: selectedSetId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create invite");

      onSuccess(data.url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-secondary-fixed/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-on-secondary-fixed">Invite Candidate</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Candidate Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-surface-container-low rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-surface-container-low rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="candidate@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Question Set</label>
            <select
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              className="w-full h-12 bg-surface-container-low rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
            >
              {questionSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.id === "default" ? "Standard Assessment" : set.id} ({set.count} questions)
                </option>
              ))}
              {questionSets.length === 0 && <option value="default">Standard Assessment</option>}
            </select>
          </div>

          {error && (
            <p className="text-xs font-medium text-error bg-error-container p-3 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 bg-surface-container-high text-on-surface-variant font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-14 premium-gradient text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
