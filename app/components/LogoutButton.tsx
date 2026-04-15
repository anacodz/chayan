"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton({ 
  className = "flex items-center gap-3 px-4 py-3 text-error hover:bg-error/5 rounded-xl transition-all text-sm font-bold w-full" 
}: { 
  className?: string 
}) {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className={className}
    >
      <span className="material-symbols-outlined">logout</span>
      Logout
    </button>
  );
}
