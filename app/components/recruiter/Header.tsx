"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="glass-header sticky top-0 z-40 shadow-[0_4px_20px_rgba(73,95,132,0.04)]">
      <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/recruiter" className="text-2xl font-black text-on-secondary-fixed tracking-tighter">Chayan</Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link 
              href="/recruiter" 
              className={`font-bold transition-all ${pathname === "/recruiter" ? "text-primary border-b-2 border-primary-container pb-0.5" : "text-on-surface-variant hover:text-primary"}`}
            >
              Dashboard
            </Link>
            <Link 
              href="#" 
              className={`font-medium transition-colors ${pathname.startsWith("/recruiter/interviews") ? "text-primary border-b-2 border-primary-container pb-0.5 font-bold" : "text-on-surface-variant hover:text-primary"}`}
            >
              Candidates
            </Link>
            <Link href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Assessments</Link>
            <Link href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Analytics</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative hidden xl:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              className="bg-surface-container-lowest border-none rounded-xl pl-10 pr-4 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" 
              placeholder="Search candidates…" 
              type="text" 
            />
          </div>
          <button className="premium-gradient text-white px-4 md:px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:-translate-y-px active:scale-95 transition-all hidden sm:block">
            Create New Screening
          </button>
          <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors hidden md:block">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm">HR</div>
        </div>
      </div>
    </header>
  );
}
