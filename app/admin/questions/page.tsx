"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  prompt: string;
  competencyTags: string[];
  maxDurationSeconds: number;
  order: number;
  active: boolean;
};

export default function QuestionSetManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newTags, setNewTags] = useState("");

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/admin/questions?questionSetId=default");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
      } else {
        throw new Error("Failed to load questions");
      }
    } catch (err) {
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    const tags = newTags.split(",").map(t => t.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: newPrompt, competencyTags: tags }),
      });

      if (res.ok) {
        setNewPrompt("");
        setNewTags("");
        fetchQuestions();
      } else {
        setError("Failed to add question");
      }
    } catch (err) {
      setError("Failed to add question");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this question?")) return;

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchQuestions();
      } else {
        setError("Failed to delete question");
      }
    } catch (err) {
      setError("Failed to delete question");
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-on-secondary-fixed mb-2">Question Set Manager</h1>
        <p className="text-on-surface-variant font-medium">Manage screening questions and competency tagging.</p>
      </header>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6">Add New Question</h2>
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Question Prompt</label>
            <input
              type="text"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. How would you explain fractions to a 9-year-old?"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Competency Tags (comma separated)</label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. empathy, clarity, concept_explanation"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 premium-gradient text-white font-bold rounded-xl shadow-md active:scale-95 transition-all"
          >
            Add Question
          </button>
        </form>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6">Current Questions (Default Set)</h2>
        
        {loading ? (
          <p className="text-on-surface-variant">Loading questions...</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id} className={`p-4 rounded-xl border ${q.active ? 'bg-white border-surface-container-high' : 'bg-surface-container-low/50 border-transparent opacity-60'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-block px-2 py-1 bg-surface-container text-xs font-bold rounded-md mb-2">Order: {q.order}</span>
                    {!q.active && <span className="inline-block ml-2 px-2 py-1 bg-error-container text-on-error-container text-xs font-bold rounded-md mb-2">Inactive</span>}
                    <h3 className="font-bold text-on-surface">{q.prompt}</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {q.competencyTags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {q.active && (
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 text-error hover:bg-error-container/50 rounded-lg transition-colors"
                      title="Deactivate question"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-on-surface-variant italic">No questions found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
