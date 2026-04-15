"use client";

interface CompleteProps {
  answersCount: number;
}

export default function Complete({ answersCount }: CompleteProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 md:p-10 bg-background relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[36%] bg-[#f6f2e8]/70 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary-fixed/25 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 right-8 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl" />

      <div className="w-full max-w-[1040px] relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <section className="lg:col-span-7 space-y-5">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">Assessment Complete • 100%</p>
          <h1 className="text-5xl leading-[1.08] font-black tracking-tight text-on-secondary-fixed">
            You&rsquo;re all set.
            <br />
            <span className="italic font-semibold text-primary">Thank you for your time.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Your responses have been securely submitted to the Cuemath hiring team for evaluation.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="w-16 h-16 rounded-2xl bg-tertiary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-3xl text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">Submission received</p>
              <p className="text-sm text-on-surface-variant">{answersCount} responses captured and analyzed.</p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="glass-panel rounded-2xl p-6 md:p-7 text-left space-y-5 shadow-[0_12px_40px_rgba(73,95,132,0.08)]">
            <h3 className="font-bold text-on-secondary-fixed flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              What happens next
            </h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                Our AI has analyzed your {answersCount} responses across six competency dimensions.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                A recruiter will review your report with recommendations and highlights.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                You will receive an update from our team soon.
              </li>
            </ul>

            <button
              onClick={() => {
                window.location.reload();
              }}
              className="w-full h-12 rounded-xl border border-outline-variant/30 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              Start Over (Demo)
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
