"use client";

import { useState } from "react";
import Link from "next/link";
import CuemathLogo from "../CuemathLogo";

interface WelcomeProps {
  onAccept: () => void;
  onDecline: () => void;
  session?: {
    candidate: {
      name: string;
      subject?: string;
      experienceLevel?: string;
    };
  };
}

export default function Welcome({ onAccept, onDecline, session }: WelcomeProps) {
  const [consented, setConsented] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden bg-background">
      <div className="absolute top-6 right-6 md:top-8 md:right-10 z-50">
        <Link 
          href="/recruiter" 
          className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 group border border-outline-variant/10 shadow-sm"
        >
          <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">login</span>
          Recruiter Login
        </Link>
      </div>

      <div className="absolute inset-y-0 right-0 w-[38%] bg-[#f0f4f8]/70 pointer-events-none hidden lg:block" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/15 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-[1180px] z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <CuemathLogo className="w-14 h-14 drop-shadow-md" />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-primary leading-none">Chayan</span>
                </div>
                <span className="text-[10px] font-bold tracking-[0.3em] text-secondary uppercase mt-1">Tutor Screener</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-5xl md:text-[64px] font-bold text-on-surface tracking-tight leading-[1.05]">
                {session ? `Ready, ${session.candidate.name.split(" ")[0]}?` : "Shape the"} <br/>
                <span className="text-primary italic">{session ? "Show your mastery." : "MathFit™ mindset."}</span>
              </h2>
              <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed font-medium">
                {session 
                  ? `We've prepared a specialized assessment for your expertise in ${session.candidate.subject || "Teaching"} at the ${session.candidate.experienceLevel || "Expert"} level.`
                  : "Welcome to the Cuemath elite educator screening. We're looking for masters of conceptual understanding to join our global network of 2,000+ experts."
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 flex flex-col gap-4 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">psychology</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg">Conceptual Mastery</h3>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">Demonstrate your ability to make complex math feel intuitive.</p>
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 flex flex-col gap-4 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg">AI-Powered Signal</h3>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">Our models provide objective feedback on your pedagogical style.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-5 lg:pl-2">
            <div className="glass-panel p-8 md:p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,46,110,0.08)] flex flex-col gap-8 max-w-[440px] w-full ml-auto border border-white/40">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-on-surface">Candidate Consent</h3>
                <p className="text-sm text-on-surface-variant">Transparency is our priority at Cuemath.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Secure Evaluation</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1">Your responses are encrypted and used exclusively for your application at Cuemath.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">balance</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">Bias-Free Assessment</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1">We use standardized rubrics to ensure an equitable screening for every educator.</p>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 space-y-3 mt-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-[18px]">mic_external_on</span>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">Recording Quality Guide</h4>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[11px] text-on-surface-variant font-medium leading-tight">
                      <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5">check_circle</span>
                      <span>Find a quiet room with minimal background noise.</span>
                    </li>
                    <li className="flex items-start gap-2 text-[11px] text-on-surface-variant font-medium leading-tight">
                      <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5">check_circle</span>
                      <span>Use a headset or external mic for best results.</span>
                    </li>
                    <li className="flex items-start gap-2 text-[11px] text-on-surface-variant font-medium leading-tight">
                      <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5">check_circle</span>
                      <span>Speak clearly at a natural, moderate pace.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer" 
                      type="checkbox"
                      checked={consented}
                      onChange={(e) => setConsented(e.target.checked)}
                    />
                    <span className="text-xs text-on-surface-variant leading-relaxed select-none group-hover:text-on-surface transition-colors">
                      I consent to the recording of this session and agree to Cuemath&apos;s <span className="text-primary font-semibold underline decoration-primary/30">Candidate Terms</span> and <span className="text-primary font-semibold underline decoration-primary/30">Privacy Policy</span>.
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <button 
                  disabled={!consented}
                  onClick={onAccept}
                  className="w-full h-16 premium-gradient rounded-2xl text-white font-bold text-lg shadow-xl active:scale-[0.98] hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  Start Assessment
                  <span className="material-symbols-outlined">rocket_launch</span>
                </button>
                <button 
                  onClick={onDecline}
                  className="w-full h-12 text-on-surface-variant font-bold text-sm rounded-xl hover:bg-surface-container-high transition-colors tracking-wide"
                >
                  Decline &amp; Exit
                </button>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-3 mt-2 border-t border-outline-variant/10 pt-6">
                <div className="flex items-center gap-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                  <CuemathLogo className="w-5 h-5" />
                  <span className="text-sm font-black tracking-tight text-on-surface">Cuemath</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-30">
                  <span className="material-symbols-outlined text-[12px]">security</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-on-surface-variant">Secured AI Environment</span>
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
