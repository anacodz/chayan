"use client";

import Sidebar from "../../components/recruiter/Sidebar";
import Header from "../../components/recruiter/Header";
import { useEffect, useState } from "react";
import Link from "next/link";
import { safeFetch } from "@/lib/api-client";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  image: string;
  lastLogin: string;
  decisionsCount: number;
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchTeam() {
      try {
        const data = await safeFetch<{ team: TeamMember[] }>(
          "/api/recruiter/team",
          {},
          { team: [] }
        );
        setTeam(data.team);
      } catch {
        setError("Failed to load team data");
      } finally {
        setLoading(false);
      }
    }
    fetchTeam();
  }, []);

  const filteredTeam = team.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header onInviteClick={() => {}} />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <header className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-on-secondary-fixed tracking-tight mb-1">Team</h1>
            <p className="text-on-surface-variant font-medium text-sm md:text-base">Manage recruiters and their review activity.</p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="animate-spin w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-error font-bold">{error}</div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/5">
              <div className="p-6 md:p-8 border-b border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                <h3 className="text-xl font-bold text-on-surface">Registered Recruiters</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[640px]">
                  <thead className="bg-surface-container-low/50">
                    <tr>
                      <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Recruiter</th>
                      <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Last Login</th>
                      <th className="px-6 md:px-8 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Decisions Made</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredTeam.map((member) => (
                      <tr key={member.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-6 md:px-8 py-5">
                          <div className="flex items-center gap-4">
                            {member.image ? (
                              <img src={member.image} alt={member.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {member.name[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-on-surface">{member.name}</p>
                              <p className="text-xs text-on-surface-variant">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-5">
                          <span className="text-sm font-medium text-on-surface">
                            {new Date(member.lastLogin).toLocaleDateString()} at {new Date(member.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-5">
                          <span className="inline-flex items-center justify-center bg-tertiary/10 text-tertiary font-bold px-3 py-1 rounded-full text-xs">
                            {member.decisionsCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredTeam.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 md:px-8 py-10 text-center text-on-surface-variant italic">
                          No team members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="h-16" />
        </main>
      </div>
    </div>
  );
}
