"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Header({ onInviteClick }: { onInviteClick: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,46,110,0.04)] border-b border-outline-variant/10 print:hidden">
      <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/recruiter" className="flex items-center gap-2 group">
            <span className="text-xl font-black text-primary tracking-tighter uppercase">Chayan</span>
          </Link>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={onInviteClick}
            className="premium-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all hidden sm:flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Invite Candidate
          </button>
          
          <div className="flex items-center gap-3 ml-2 border-l border-outline-variant/15 pl-4 relative group">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-on-surface leading-none">{session?.user?.name || "Recruiter"}</p>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter mt-1">{session?.user?.email?.split('@')[0] || "Staff"}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
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
    </header>
  );
}
