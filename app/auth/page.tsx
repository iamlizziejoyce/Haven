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
        if (!name.trim()) { setError("Please enter your first name."); setLoading(false); return; }
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

  const canSubmit = email.trim() && password.length >= 6 && (mode === "login" || name.trim()) && !loading;

  return (
    <div
      className="min-h-dvh w-full flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(160deg, #F5E0D0 0%, #F7EDE4 40%, #FAF0E8 100%)" }}
    >
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="font-sans text-[38px] font-semibold text-navy tracking-[8px] mb-1">HAVEN</h1>
        <p className="text-[13px] text-muted italic">a relationship-aware personal companion</p>
      </div>

      <div className="w-full max-w-[320px] bg-white/70 backdrop-blur rounded-[24px] border border-white/80 shadow-sm px-6 py-7">
        <p className="text-[14px] text-muted text-center mb-5 leading-relaxed">
          {mode === "login"
            ? "Welcome back. Sign in to your conversations."
            : "A private space to think through your relationships."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              className="w-full px-4 py-3.5 bg-cream border border-mid rounded-[14px] text-[16px] text-navy font-sans placeholder-muted focus:border-navy/40 transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-4 py-3.5 bg-cream border border-mid rounded-[14px] text-[16px] text-navy font-sans placeholder-muted focus:border-navy/40 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full px-4 py-3.5 bg-cream border border-mid rounded-[14px] text-[16px] text-navy font-sans placeholder-muted focus:border-navy/40 transition-colors"
          />

          {error && <p className="text-[#C0392B] text-[12px] text-center leading-snug">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 bg-navy text-white rounded-[14px] text-[15px] font-semibold mt-1 disabled:bg-mid disabled:text-muted/60 disabled:cursor-default transition-colors shadow-sm"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Begin"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          className="w-full mt-4 text-[13px] text-muted hover:text-navy/70 transition-colors"
        >
          {mode === "login" ? "New to Haven? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
