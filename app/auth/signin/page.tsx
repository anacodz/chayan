"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/recruiter");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md z-10 glass-panel p-8 md:p-10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">psychology</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-on-secondary-fixed">Chayan Recruiter</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-sm text-on-surface-variant mb-8">Please enter your credentials to access the recruiter dashboard.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-surface-container-low rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="admin@cuemath.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-surface-container-low rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-error bg-error-container p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 premium-gradient rounded-xl text-white font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-8">
          Development Mode: use admin@cuemath.com / admin123
        </p>
      </div>
    </main>
  );
}
