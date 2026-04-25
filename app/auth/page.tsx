"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Please enter your first name.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (error) throw error;
        router.push("/home");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/home");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    email.trim() && password.length >= 6 && (mode === "login" || name.trim()) && !loading;

  return (
    <div className="min-h-dvh w-full bg-dark flex flex-col items-center justify-center px-7 py-12">
      {/* Logo */}
      <div className="text-center mb-11">
        <span className="text-gold text-[22px] block mb-3">◈</span>
        <span className="font-serif text-[36px] font-semibold text-white tracking-[10px] block mb-2.5">
          HAVEN
        </span>
        <span className="text-[12px] text-[#4A6888] italic">
          a relationship-aware personal companion
        </span>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-[300px]">
        <p className="text-[13px] text-[#4A6888] text-center mb-5 leading-relaxed">
          {mode === "login"
            ? "Welcome back. Sign in to access your conversations."
            : "Haven is a private space to think through your relationships."}
        </p>

        {mode === "signup" && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-[9px] text-white text-[16px] font-sans placeholder-[#3A5470] focus:border-gold/50 transition-colors"
            />
          </div>
        )}

        <div className="mb-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-[9px] text-white text-[16px] font-sans placeholder-[#3A5470] focus:border-gold/50 transition-colors"
          />
        </div>

        <div className="mb-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-[9px] text-white text-[16px] font-sans placeholder-[#3A5470] focus:border-gold/50 transition-colors"
          />
        </div>

        {error && (
          <p className="text-[#FF9090] text-[12px] text-center mb-3 leading-snug">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3.5 bg-gold text-dark rounded-[9px] text-[14px] font-semibold disabled:bg-white/[0.08] disabled:text-[#3A5470] disabled:cursor-default transition-colors"
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Begin"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
          className="w-full mt-4 text-[12px] text-[#4A6888] hover:text-[#6A88A8] transition-colors"
        >
          {mode === "login" ? "New to Haven? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
