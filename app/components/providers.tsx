"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  // SessionProvider can be picky about missing environment variables during prerendering
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
