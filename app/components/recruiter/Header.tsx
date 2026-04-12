import Link from "next/link";
import { usePathname } from "next/navigation";
import CuemathLogo from "../CuemathLogo";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,46,110,0.04)] border-b border-outline-variant/10">
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
          <button className="premium-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all hidden sm:flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Invite Candidate
          </button>
          <button className="p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors hidden md:block">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5">
            <img alt="Recruiter Profile" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9GUYn9C5MP5yXNGUL4LKLq3y0L8f29YPYXlf4sfafldpBoxjsA9r0np-GKF-Zs6qSjnjkGH_nvhhT7kUVdkI0g6a40FOt0raXZ_RD3pLrqdF_ydeDLQWKYYpEnvw8ZD-K9imjQUt3TKj--D_HOrbTOAb2rKH-q9etGx8sx-SVpqybHff2gtUXgk0foZ7wrS436sbwCf4pBz030Z8uus_Ut894b7pYqA0yDRO9DbimQTWRhD2RsVOwIrCbj0mKYFIKeU4LyqyTrVCg" />
          </div>
        </div>
      </div>
    </header>
  );
}
