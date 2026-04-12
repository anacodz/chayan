"use client";

import { useState } from "react";

interface WelcomeProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function Welcome({ onAccept, onDecline }: WelcomeProps) {
  const [consented, setConsented] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden bg-background">
      <div className="absolute inset-y-0 right-0 w-[38%] bg-[#f6f2e8]/70 pointer-events-none hidden lg:block" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-5xl z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-2xl">menu_book</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-[0.2em] text-on-secondary-fixed uppercase">Cuemath</span>
                <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase -mt-1 ml-0.5">Tutor Screener</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm font-bold tracking-[0.1em] text-primary uppercase">Elite Educator Network</p>
              <h2 className="text-4xl sm:text-5xl md:text-[60px] font-bold text-on-surface tracking-tight leading-[1.08]">
                Empower the <br/>
                <span className="text-primary italic">next generation.</span>
              </h2>
              <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                Welcome to the Cuemath expert screening. We&apos;ve curated a space for you to demonstrate your pedagogical mastery through a voice-first interactive session.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_rgba(73,95,132,0.04)] border-none flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined">record_voice_over</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Voice-First Experience</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Natural dialogue processing for real-time pedagogical assessment.</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_rgba(73,95,132,0.04)] border-none flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container">
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">15-Minute Duration</h3>
                  <p className="text-sm text-on-surface-variant mt-1">A focused session designed to value your time and expertise.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-5 lg:pl-2">
            <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-2xl shadow-[0_12px_40px_rgba(73,95,132,0.08)] flex flex-col gap-8 max-w-[430px] w-full ml-auto">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-on-surface">Candidate Consent</h3>
                <p className="text-sm text-on-surface-variant">Please review our transparency guidelines before we begin.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Data Privacy &amp; Security</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1">Your voice responses are encrypted and used solely for candidate evaluation purposes by Cuemath.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1">
                    <span className="material-symbols-outlined text-primary">gavel</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Ethical AI Framework</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1">Our scoring models are audited for bias to ensure an equitable assessment for every educator.</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border-none">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20" 
                      type="checkbox"
                      checked={consented}
                      onChange={(e) => setConsented(e.target.checked)}
                    />
                    <span className="text-xs text-on-surface-variant leading-relaxed select-none">
                      I consent to the recording of this session and agree to the <span className="text-primary font-semibold underline decoration-primary/30">Terms of Service</span> and <span className="text-primary font-semibold underline decoration-primary/30">Privacy Policy</span>.
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <button 
                  disabled={!consented}
                  onClick={onAccept}
                  className="w-full h-14 premium-gradient rounded-xl text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Accept &amp; Continue
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button 
                  onClick={onDecline}
                  className="w-full h-12 bg-surface-container-high text-on-surface-variant font-medium rounded-xl hover:bg-surface-container-highest transition-colors"
                >
                  Decline &amp; Exit
                </button>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 grayscale opacity-80">
                  <span className="text-xl font-black tracking-[0.25em] text-on-surface uppercase">Cuemath</span>
                </div>
                <div className="flex items-center gap-1 opacity-40">
                  <span className="material-symbols-outlined text-[10px]">lock</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-on-surface-variant">Secure AI Session</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-12 left-12 hidden lg:flex items-center gap-4">
        <div className="flex -space-x-3">
          <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBplEnez1pBV0osV1A0_LUKWhV1ncjPcGp5iKIyJP4BxLaAlPY8Gg_VJSlIno4Y-Kmxdph-tyhwuM0e4ZsIinfrG89aKklecPsS6EX4rWWVX2y8t8e8D4xJsh1Q6zPYlA1Dl3WbE_3SXk8sYSOeDbszHHgujKnfemvRiTnUU8PDpgkhD_DIVudgWkClQjCgqHTPeliEY6KxzyibGlSwfSO8tUd7N9sRINZdqZgGu1z2SVcIho_gexcYcEKSmOQNOB4obgAxxyAtSjMN" alt="Tutor" />
          <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjUvJa4dxzzg2ZjJPte_5S-C8mF8XKgqYN50pm5Bmh7oIvk5ZCemiejOQArUmfnN3hlpsiOBrrczHhE_q2uMQJhHDLaACcBO41hCaEKJTK4lEWaz3iObVsdXuLzGSMY0Aroj8vSaUNCbgNXkVx6_vkm2bb1Jy-54tLG2aZV5gnDBr9FwkowX93vobt_lNtE9yptKTZCZuTUZ-BaCYODFaRZFgjQS_4-WGCIpH6VvHVKkcYnGtRfWQAb0jCb1D9udMW4AEzO1jVyVnS" alt="Tutor" />
          <div className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-white">
            +2k
          </div>
        </div>
        <p className="text-xs font-medium text-on-surface-variant">Join 2,000+ expert educators curated by Cuemath.</p>
      </div>
    </main>
  );
}
