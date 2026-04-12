"use client";

interface CompleteProps {
  answersCount: number;
}

export default function Complete({ answersCount }: CompleteProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg text-center flex flex-col items-center gap-8">
        <div className="w-20 h-20 rounded-full bg-tertiary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-on-secondary-fixed tracking-tight">Screening Complete</h1>
          <p className="text-on-surface-variant text-lg">Thank you for completing your Cuemath tutor screening.</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 w-full text-left space-y-4 shadow-sm border border-outline-variant/5">
          <h3 className="font-bold text-on-secondary-fixed flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">schedule</span>
            What happens next
          </h3>
          <ul className="space-y-3 text-sm text-on-surface-variant">
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              Our AI has analysed your {answersCount} responses across 6 competency dimensions.
            </li>
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              A recruiter from Cuemath will review your screening report.
            </li>
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              Expect to hear back within 2–3 business days.
            </li>
          </ul>
        </div>
        <button onClick={() => { window.location.reload(); }} className="text-sm font-medium text-primary hover:underline">← Start over (demo)</button>
      </div>
    </main>
  );
}
