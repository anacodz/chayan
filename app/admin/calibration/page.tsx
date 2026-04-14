"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  prompt: string;
  competencyTags: string[];
};

type CalibrationSample = {
  id: string;
  questionId: string;
  question: Question;
  transcript: string;
  communicationClarity: number;
  conceptExplanation: number;
  empathyAndPatience: number;
  adaptability: number;
  professionalism: number;
  englishFluency: number;
  reasoning: string | null;
  createdAt: string;
};

type SampleInput = {
  questionId: string;
  transcript: string;
  communicationClarity: number;
  conceptExplanation: number;
  empathyAndPatience: number;
  adaptability: number;
  professionalism: number;
  englishFluency: number;
  reasoning: string;
};

type TestResult = {
  evaluation: {
    confidence: number;
  };
  comparison: Record<string, { ai: number; truth: number }>;
};

export default function CalibrationDashboard() {
  const [samples, setSamples] = useState<CalibrationSample[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newSample, setNewSample] = useState<SampleInput>({
    questionId: "",
    transcript: "",
    communicationClarity: 3,
    conceptExplanation: 3,
    empathyAndPatience: 3,
    adaptability: 3,
    professionalism: 3,
    englishFluency: 3,
    reasoning: "",
  });

  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [samplesRes, questionsRes] = await Promise.all([
        fetch("/api/admin/calibration"),
        fetch("/api/admin/questions"),
      ]);

      if (samplesRes.ok && questionsRes.ok) {
        const samplesData = await samplesRes.json();
        const questionsData = await questionsRes.json();
        setSamples(samplesData.samples);
        setQuestions(questionsData.questions);
        if (questionsData.questions.length > 0) {
          setNewSample(prev => ({ ...prev, questionId: questionsData.questions[0].id }));
        }
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSample = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSample),
      });

      if (res.ok) {
        fetchData();
        setNewSample({
          questionId: questions[0]?.id || "",
          transcript: "",
          communicationClarity: 3,
          conceptExplanation: 3,
          empathyAndPatience: 3,
          adaptability: 3,
          professionalism: 3,
          englishFluency: 3,
          reasoning: "",
        });
      }
    } catch (err) {
      setError("Failed to add sample");
    }
  };

  const runTest = async (sample: CalibrationSample) => {
    setTestingId(sample.id);
    try {
      const res = await fetch("/api/admin/calibration/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: sample.question.prompt,
          transcript: sample.transcript,
          competencyTags: sample.question.competencyTags,
          groundTruth: {
            communicationClarity: sample.communicationClarity,
            conceptExplanation: sample.conceptExplanation,
            empathyAndPatience: sample.empathyAndPatience,
            adaptability: sample.adaptability,
            professionalism: sample.professionalism,
            englishFluency: sample.englishFluency,
          }
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestResults(prev => ({ ...prev, [sample.id]: data }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestingId(null);
    }
  };

  if (loading) return <div className="p-8">Loading Calibration Data...</div>;

  return (
    <div className="space-y-10 max-w-6xl">
      <header>
        <h1 className="text-3xl font-extrabold text-on-secondary-fixed mb-2 tracking-tight">Model Calibration & Quality</h1>
        <p className="text-on-surface-variant font-medium">Review AI performance against ground-truth human evaluations.</p>
      </header>

      {/* Add Sample Form */}
      <section className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/10">
        <h2 className="text-xl font-bold mb-6">Add New Calibration Sample</h2>
        <form onSubmit={handleAddSample} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Question</label>
                <select 
                  value={newSample.questionId}
                  onChange={e => setNewSample({...newSample, questionId: e.target.value})}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {questions.map(q => <option key={q.id} value={q.id}>{q.prompt.substring(0, 60)}...</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Candidate Transcript</label>
                <textarea 
                  value={newSample.transcript}
                  onChange={e => setNewSample({...newSample, transcript: e.target.value})}
                  placeholder="Paste the transcription here..."
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm min-h-[150px] focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ground Truth Scores (1-5)</label>
              <div className="grid grid-cols-2 gap-4">
                {(['communicationClarity', 'conceptExplanation', 'empathyAndPatience', 'adaptability', 'professionalism', 'englishFluency'] as const).map(dim => (
                  <div key={dim}>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">{dim.replace(/([A-Z])/g, ' $1')}</label>
                    <input 
                      type="number" min="1" max="5" 
                      value={newSample[dim]}
                      onChange={e => setNewSample({...newSample, [dim]: parseInt(e.target.value)})}
                      className="w-full bg-surface-container-low border-none rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Human Reasoning (Optional)</label>
                <textarea 
                  value={newSample.reasoning}
                  onChange={e => setNewSample({...newSample, reasoning: e.target.value})}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm min-h-[80px]"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="px-8 py-3 premium-gradient text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">
            Save Sample
          </button>
        </form>
      </section>

      {/* Samples List */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold">Calibration Samples</h2>
        <div className="grid grid-cols-1 gap-6">
          {samples.map(sample => (
            <div key={sample.id} className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Question</p>
                    <h3 className="font-bold text-on-surface leading-tight mb-4">&quot;{sample.question.prompt}&quot;</h3>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Transcript</p>
                    <p className="text-sm text-on-surface-variant italic">&quot;{sample.transcript.substring(0, 200)}...&quot;</p>
                  </div>
                  <button 
                    onClick={() => runTest(sample)}
                    disabled={testingId === sample.id}
                    className="ml-6 px-4 py-2 bg-surface-container-high text-primary rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                    {testingId === sample.id ? "Analyzing..." : "Run AI Test"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-outline-variant/10">
                  <div>
                    <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Ground Truth (Human)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Clarity', val: sample.communicationClarity },
                        { label: 'Explain', val: sample.conceptExplanation },
                        { label: 'Empathy', val: sample.empathyAndPatience },
                        { label: 'Adapt', val: sample.adaptability },
                        { label: 'Prof', val: sample.professionalism },
                        { label: 'English', val: sample.englishFluency },
                      ].map(d => (
                        <div key={d.label} className="bg-surface-container-low p-2 rounded-lg text-center">
                          <p className="text-[8px] font-bold text-on-surface-variant uppercase">{d.label}</p>
                          <p className="text-lg font-black text-primary">{d.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {testResults[sample.id] && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                      <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4 flex justify-between">
                        AI Result (Gemini 2.0)
                        <span className="text-tertiary">Confidence: {Math.round(testResults[sample.id].evaluation.confidence * 100)}%</span>
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(testResults[sample.id].comparison).map(([key, data]) => {
                          const diff = Math.abs(data.ai - data.truth);
                          return (
                            <div key={key} className={`p-2 rounded-lg text-center border ${diff === 0 ? 'bg-tertiary/5 border-tertiary/20' : diff <= 1 ? 'bg-secondary/5 border-secondary/20' : 'bg-error/5 border-error/20'}`}>
                              <p className="text-[8px] font-bold text-on-surface-variant uppercase">{key.replace(/([A-Z])/g, ' $1').substring(0, 7)}</p>
                              <p className="text-lg font-black text-on-surface">{data.ai}</p>
                              <p className={`text-[8px] font-bold ${diff === 0 ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                                {diff === 0 ? 'MATCH' : `Δ ${data.ai > data.truth ? '+' : ''}${data.ai - data.truth}`}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
