"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CuemathLogo from "../CuemathLogo";
import InviteModal from "../InviteModal";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleInviteSuccess = (url: string) => {
    alert(`Invitation email sent! \n\nFallback Link: ${url}`);
    // Refresh page or update list if necessary
    window.location.reload();
  };

  return (
    <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,46,110,0.04)] border-b border-outline-variant/10 print:hidden">
      <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/recruiter" className="flex items-center gap-2 group">
            <CuemathLogo className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-black text-primary tracking-tighter">Cuemath</span>
          </Link>
          <nav className="hidden lg:flex gap-8 items-center">
            <Link 
              href="/recruiter" 
              className={`text-sm font-bold transition-all ${pathname === "/recruiter" ? "text-primary border-b-2 border-primary pb-0.5" : "text-on-surface-variant hover:text-primary"}`}
            >
              Dashboard
            </Link>
            <Link 
              href="#" 
              className={`text-sm font-bold transition-all ${pathname.startsWith("/recruiter/interviews") ? "text-primary border-b-2 border-primary pb-0.5" : "text-on-surface-variant hover:text-primary"}`}
            >
              Candidates
            </Link>
            <Link href="#" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Assessments</Link>
            <Link href="#" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Analytics</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative hidden xl:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              className="bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all" 
              placeholder="Search by name, role or skill..." 
              type="text" 
            />
          </div>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="premium-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all hidden sm:flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Invite Candidate
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <span className="material-symbols-outlined">
              {isDarkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>

          <button className="p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          
          <div className="flex items-center gap-3 ml-2 border-l border-outline-variant/15 pl-4 relative group">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-on-surface leading-none">{session?.user?.name || "Recruiter"}</p>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter mt-1">{session?.user?.email?.split('@')[0] || "Staff"}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 hover:border-error/40 transition-colors"
              title="Logout"
            >
              {session?.user?.image ? (
                <img alt="Recruiter Profile" className="w-full h-full rounded-full object-cover" src={session.user.image} />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase hover:bg-error/10 hover:text-error transition-colors">
                  {session?.user?.name ? session.user.name[0] : "R"}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        onSuccess={handleInviteSuccess} 
      />
    </header>
  );
}
