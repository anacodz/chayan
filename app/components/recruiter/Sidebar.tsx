"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CuemathLogo from "../CuemathLogo";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { icon: "dashboard",         label: "Overview",        href: "/recruiter" },
  { icon: "record_voice_over", label: "Live Sessions",   href: "/recruiter/live" },
  { icon: "settings_voice",    label: "Voice Quality",   href: "/recruiter/quality" },
  { icon: "psychology",        label: "Scoring Models",  href: "/admin/questions" },
  { icon: "group",             label: "Team",            href: "/recruiter/team" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-surface-container-low p-6 gap-2 border-r border-outline-variant/10">
      <div className="mb-10 flex items-center gap-3">
        <CuemathLogo className="w-10 h-10" />
        <div>
          <h2 className="text-primary font-black text-xl leading-none">Cuemath</h2>
          <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Recruiter Hub</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:bg-surface-container-high group ${isActive ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-1" : "text-on-surface-variant hover:text-primary"}`}
            >
              <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pt-6 border-t border-outline-variant/15 flex flex-col gap-2">
        <button className="w-full premium-gradient text-white py-4 rounded-2xl font-bold mb-4 shadow-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          New Screening
        </button>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-xl transition-all text-sm font-bold">
          <span className="material-symbols-outlined">help</span>Support
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error/5 rounded-xl transition-all text-sm font-bold"
        >
          <span className="material-symbols-outlined">logout</span>Logout
        </button>
      </div>
    </aside>
  );
}
