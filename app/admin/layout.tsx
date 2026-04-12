import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-surface-container-low p-4 gap-2">
        <div className="mb-8 px-2 py-4">
          <h2 className="text-on-secondary-fixed font-black text-lg">Admin Portal</h2>
          <p className="text-secondary text-xs uppercase tracking-widest font-bold mt-0.5">System Configuration</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <Link
            href="/admin/questions"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1 bg-surface-container-lowest text-primary shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              list_alt
            </span>
            <span className="font-medium text-sm">Question Sets</span>
          </Link>
          <Link
            href="/api/admin/metrics"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1 text-secondary hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">analytics</span>
            <span className="font-medium text-sm">System Metrics</span>
          </Link>
        </nav>

        <div className="pt-6 border-t border-outline-variant/10 flex flex-col gap-1">
          <Link
            href="/recruiter"
            className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-high rounded-xl transition-all text-sm font-medium"
          >
            <span className="material-symbols-outlined">switch_account</span>
            Recruiter Portal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top nav */}
        <header className="glass-header sticky top-0 z-40 shadow-[0_4px_20px_rgba(73,95,132,0.04)]">
          <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-[1920px] mx-auto">
            <div className="flex items-center gap-8">
              <span className="text-2xl font-black text-on-secondary-fixed tracking-tighter uppercase">Cuemath</span>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">AD</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
