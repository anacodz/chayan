"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    if (inviteToken) {
      router.replace(`/interview/${inviteToken}`);
    }
  }, [inviteToken, router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-5xl">mic</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-primary tracking-tighter">Chayan</h1>
          <p className="text-on-surface-variant font-bold text-lg">
            AI-Driven Voice Screening
          </p>
        </div>

        <div className="p-10 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <p className="text-sm md:text-base text-on-surface-variant font-medium leading-relaxed mb-6">
            If you have been invited to a Cuemath tutor screening, please click the unique interview link provided in your email. or <Link href="/recruiter" className="text-inherit"><u>login as a recruiter</u></Link>
          </p>
          <div className="h-1.5 w-12 bg-primary/20 mx-auto rounded-full" />
        </div>
        
        <footer className="pt-8">
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant/40">
            Powered by Cuemath Engineering
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
