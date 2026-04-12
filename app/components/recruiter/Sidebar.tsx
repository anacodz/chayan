"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: "dashboard",         label: "Overview",        href: "/recruiter", active: true  },
  { icon: "record_voice_over", label: "Live Sessions",   href: "#",          active: false },
  { icon: "settings_voice",    label: "Voice Quality",   href: "#",          active: false },
  { icon: "psychology",        label: "Scoring Models",  href: "#",          active: false },
  { icon: "group",             label: "Team",            href: "#",          active: false },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-surface-container-low p-4 gap-2">
      <div className="mb-8 px-2 py-4">
        <h2 className="text-on-secondary-fixed font-black text-lg">Recruiter Portal</h2>
        <p className="text-secondary text-xs uppercase tracking-widest font-bold mt-0.5">Expert Mode</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1 ${isActive ? "bg-surface-container-lowest text-primary shadow-sm" : "text-secondary hover:bg-surface-container-high"}`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pt-6 border-t border-outline-variant/10 flex flex-col gap-1">
        <button className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-bold mb-4 shadow-sm active:scale-95 transition-all text-sm">
          Invite Candidate
        </button>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-high rounded-xl transition-all text-sm font-medium">
          <span className="material-symbols-outlined">help</span>Support
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-high rounded-xl transition-all text-sm font-medium">
          <span className="material-symbols-outlined">logout</span>Logout
        </Link>
      </div>
    </aside>
  );
}
