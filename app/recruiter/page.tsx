"use client";

import Link from "next/link";

const MOCK_CANDIDATES = [
  { id: "s1", name: "Aaliya Sharma",  initials: "AS", role: "Primary School Educator",    type: "Tutor Voice Screening", status: "Needs Review", score: 92,   statusClass: "bg-primary-container text-on-primary-container" },
  { id: "s2", name: "Rahul Kumar",    initials: "RK", role: "Mathematics Tutor",           type: "Tutor Voice Screening", status: "Completed",    score: 78,   statusClass: "bg-tertiary/10 text-tertiary" },
  { id: "s3", name: "Meera Pillai",   initials: "MP", role: "Science Educator",            type: "Tutor Voice Screening", status: "In Progress",  score: null, statusClass: "bg-secondary/10 text-secondary" },
  { id: "s4", name: "Vikram Nair",    initials: "VN", role: "English Language Tutor",      type: "Tutor Voice Screening", status: "Completed",    score: 88,   statusClass: "bg-tertiary/10 text-tertiary" },
];

const NAV_ITEMS = [
  { icon: "dashboard",       label: "Overview",       href: "/recruiter", active: true  },
  { icon: "record_voice_over", label: "Tutor Reports", href: "#",          active: false },
  { icon: "help_center",     label: "Question Bank",  href: "#",          active: false },
  { icon: "group",           label: "Team",           href: "#",          active: false },
];

export default function RecruiterDashboard() {
  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-surface-container-low p-4 gap-2">
        <div className="mb-8 px-2 py-4">
          <h2 className="text-on-secondary-fixed font-black text-lg">Chayan</h2>
          <p className="text-secondary text-xs uppercase tracking-widest font-bold mt-0.5">Recruiter Portal</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1 ${
                item.active
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-secondary hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="pt-6 border-t border-outline-variant/20 flex flex-col gap-1">
          <button className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-bold mb-4 shadow-sm active:scale-95 transition-all text-sm">
            Invite Candidate
          </button>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-high rounded-xl transition-all text-sm font-medium">
            <span className="material-symbols-outlined">help</span>
            Support
          </Link>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">

        {/* Top nav */}
        <header className="glass-header sticky top-0 z-40 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-center w-full px-8 py-4">
            <div className="flex items-center gap-8">
              <span className="text-2xl font-black text-on-secondary-fixed tracking-tighter lg:hidden">Chayan</span>
              <nav className="hidden md:flex gap-6 items-center">
                <Link href="/recruiter" className="text-primary font-bold border-b-2 border-primary-container pb-0.5 transition-all">Dashboard</Link>
                <Link href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Candidates</Link>
                <Link href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Assessments</Link>
                <Link href="#" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Analytics</Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden lg:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="Search candidates…"
                  type="text"
                />
              </div>
              <button className="premium-gradient text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:-translate-y-px active:scale-95 transition-all">
                Create Screening
              </button>
              <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 rounded-full text-secondary hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm">HR</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-on-secondary-fixed tracking-tight mb-1">Recruitment Overview</h1>
            <p className="text-on-surface-variant font-medium">AI-powered tutor candidate assessment pipeline.</p>
          </header>

          {/* Metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col gap-4 hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-outline-variant/10">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <span className="material-symbols-outlined">send</span>
                </div>
                <span className="text-tertiary text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span> +12%
                </span>
              </div>
              <div>
                <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Total Invites</p>
                <p className="text-4xl font-black text-on-surface mt-1">284</p>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3" />
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl flex flex-col gap-4 hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-outline-variant/10">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-tertiary/10 rounded-2xl text-tertiary">
                  <span className="material-symbols-outlined">task_alt</span>
                </div>
                <span className="text-tertiary text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check</span> 81%
                </span>
              </div>
              <div>
                <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Completed Screenings</p>
                <p className="text-4xl font-black text-on-surface mt-1">231</p>
              </div>
              <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-tertiary w-[81%]" />
              </div>
            </div>

            <div className="bg-on-secondary-fixed p-8 rounded-3xl flex flex-col gap-4 text-white relative overflow-hidden hover:shadow-xl transition-all duration-500">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              <div className="flex justify-between items-start relative z-10">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">ACTION</span>
              </div>
              <div className="relative z-10">
                <p className="text-white/60 font-bold text-xs uppercase tracking-widest">Pending Reviews</p>
                <p className="text-4xl font-black mt-1">12</p>
              </div>
              <p className="text-white/40 text-xs mt-auto italic">Review pending reports before quota resets</p>
            </div>
          </div>

          {/* Candidate table */}
          <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/5">
            <div className="p-8 border-b border-surface-container flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-on-surface">Recent Candidates</h3>
              <div className="flex gap-2">
                <button className="text-sm font-semibold px-4 py-2 bg-surface-container-low text-secondary rounded-xl hover:bg-surface-container-high transition-all">Filter</button>
                <button className="text-sm font-semibold px-4 py-2 bg-surface-container-low text-secondary rounded-xl hover:bg-surface-container-high transition-all">Export CSV</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low/50">
                  <tr>
                    {["Candidate", "Assessment", "Status", "Match Score", ""].map((h) => (
                      <th key={h} className="px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {MOCK_CANDIDATES.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm">
                            {c.initials}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{c.name}</p>
                            <p className="text-xs text-on-surface-variant">{c.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-medium text-on-surface">{c.type}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-tight ${c.statusClass}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden min-w-[60px]">
                            {c.score && <div className="h-full bg-tertiary" style={{ width: `${c.score}%` }} />}
                          </div>
                          <span className="text-sm font-black text-tertiary">{c.score ? `${c.score}%` : "—"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link
                          href={`/recruiter/interviews/${c.id}`}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-surface-container-low/20 border-t border-surface-container flex justify-between items-center">
              <p className="text-xs font-medium text-on-surface-variant">Showing 4 of 284 candidates</p>
              <div className="flex gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors font-bold text-xs">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="h-16" />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-surface-container p-4 flex justify-around items-center z-50">
        <Link href="/recruiter" className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="text-[10px] font-bold">Dashboard</span>
        </Link>
        <Link href="#" className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined">groups</span>
          <span className="text-[10px] font-bold">Candidates</span>
        </Link>
        <Link href="#" className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined">assignment</span>
          <span className="text-[10px] font-bold">Reports</span>
        </Link>
      </nav>
    </div>
  );
}
