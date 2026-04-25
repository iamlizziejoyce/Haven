"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Person, ProfileInsight } from "@/lib/types";
import HavenLogo from "@/components/ui/HavenLogo";
import Sheet from "@/components/ui/Sheet";
import Toast from "@/components/ui/Toast";
import ProfileView from "@/components/home/ProfileView";
import AboutView from "@/components/home/AboutView";

interface Props {
  displayName: string;
  initialPeople: Person[];
  messageCounts: Record<string, number>;
  initialInsights: ProfileInsight[];
}

function formatDate(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function HomeClient({ displayName, initialPeople, messageCounts, initialInsights }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [counts, setCounts] = useState(messageCounts);
  const [insights, setInsights] = useState<ProfileInsight[]>(initialInsights);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [actionPerson, setActionPerson] = useState<Person | null>(null);
  const [actionOpen, setActionOpen] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [toast, setToast] = useState("");

  async function handleAddPerson() {
    if (!addName.trim() || addLoading) return;
    setAddLoading(true);
    const { data, error } = await supabase
      .from("people")
      .insert({ name: addName.trim(), user_id: (await supabase.auth.getUser()).data.user?.id })
      .select()
      .single();
    setAddLoading(false);
    if (error || !data) { setToast("Something went wrong."); return; }
    setAddOpen(false);
    setAddName("");
    router.push(`/chat/${data.id}`);
  }

  async function handleRename() {
    if (!actionPerson || !renameName.trim()) return;
    const { error } = await supabase
      .from("people")
      .update({ name: renameName.trim() })
      .eq("id", actionPerson.id);
    if (error) { setToast("Something went wrong."); return; }
    setPeople((prev) => prev.map((p) => p.id === actionPerson.id ? { ...p, name: renameName.trim() } : p));
    setRenameOpen(false);
    setActionPerson(null);
  }

  async function handleDelete() {
    if (!actionPerson) return;
    const { error } = await supabase.from("people").delete().eq("id", actionPerson.id);
    if (error) { setToast("Something went wrong."); return; }
    setPeople((prev) => prev.filter((p) => p.id !== actionPerson.id));
    const newCounts = { ...counts };
    delete newCounts[actionPerson.id];
    setCounts(newCounts);
    setConfirmOpen(false);
    setActionPerson(null);
  }

  async function handleImport() {
    if (!actionPerson || !importText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("summaries").insert({
      person_id: actionPerson.id,
      user_id: user.id,
      content: importText.trim(),
    });
    if (error) { setToast("Something went wrong."); return; }
    setImportOpen(false);
    setImportText("");
    setToast("Summary imported.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  async function handleDeleteInsight(id: string) {
    await fetch("/api/insights", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="min-h-dvh w-full bg-dark flex flex-col">
      {/* Header */}
      <div className="px-5 pt-[52px] pb-4">
        <HavenLogo size="sm" className="mb-7" />
        <div className="flex items-center justify-between mt-5">
          <span className="font-serif text-[22px] text-white">Hello, {displayName}</span>
          <button
            onClick={() => { setAddName(""); setAddOpen(true); }}
            className="bg-gold text-dark text-[12px] font-semibold px-3.5 py-2 rounded-[20px]"
          >
            + Add
          </button>
        </div>
      </div>

      {/* People list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
        {people.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-7">
            <span className="text-gold text-[28px] mb-4">◈</span>
            <p className="text-[15px] text-white font-medium mb-2.5">Welcome to Haven</p>
            <p className="text-[13px] text-[#4A6888] leading-[1.7]">
              Each conversation is a private space to think through a relationship — a partner, family member, friend, or colleague.
              <br /><br />
              Tap <strong className="text-gold">+ Add</strong> to start.
            </p>
          </div>
        ) : (
          people.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/chat/${p.id}`)}
              className="bg-white/[0.06] border border-white/[0.08] rounded-[12px] px-4 py-3.5 cursor-pointer flex items-center justify-between active:bg-white/10 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-white">{p.name}</span>
                <span className="text-[11px] text-[#3A5470]">
                  {p.updated_at ? `${formatDate(p.updated_at)} · ` : ""}
                  {counts[p.id] ?? 0} messages
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setActionPerson(p); setActionOpen(true); }}
                className="bg-transparent border-none text-[#4A6888] text-[18px] cursor-pointer px-1.5 py-1 leading-none"
              >
                ···
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-4 px-5 py-3 border-t border-white/[0.06]" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
        {insights.length > 0 && (
          <button onClick={() => setProfileOpen(true)} className="bg-transparent border-none text-[#4A6888] text-[12px] font-sans cursor-pointer">
            ☰ Profile
          </button>
        )}
        <button onClick={() => setAboutOpen(true)} className="bg-transparent border-none text-[#4A6888] text-[12px] font-sans cursor-pointer">
          ◈ About Haven
        </button>
        <button onClick={handleSignOut} className="bg-transparent border-none text-[#4A6888] text-[12px] font-sans cursor-pointer ml-auto">
          Sign out
        </button>
      </div>

      {/* Add Person Sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">Who would you like to talk about?</h2>
        <div className="px-5 mb-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-[1px] block mb-1.5">Name</label>
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addName.trim() && handleAddPerson()}
            autoComplete="off"
            className="w-full px-3.5 py-3 border-[1.5px] border-mid rounded-[9px] text-[16px] text-navy font-sans bg-cream focus:border-navy"
            autoFocus
          />
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setAddOpen(false)} className="flex-1 py-3.5 rounded-[9px] bg-cream text-muted border border-mid text-[14px] font-semibold font-sans">
            Cancel
          </button>
          <button
            onClick={handleAddPerson}
            disabled={!addName.trim() || addLoading}
            className="flex-1 py-3.5 rounded-[9px] bg-navy text-white text-[14px] font-semibold font-sans disabled:bg-mid disabled:text-muted"
          >
            {addLoading ? "…" : "Begin"}
          </button>
        </div>
      </Sheet>

      {/* Action Sheet */}
      <Sheet open={actionOpen} onClose={() => setActionOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">{actionPerson?.name}</h2>
        <button onClick={() => { setActionOpen(false); setTimeout(() => { setRenameName(actionPerson?.name ?? ""); setRenameOpen(true); }, 150); }} className="block w-full px-5 py-4 text-left text-[15px] text-navy font-sans border-none bg-transparent cursor-pointer active:bg-cream">
          Rename
        </button>
        <div className="h-px bg-mid" />
        <button onClick={() => { setActionOpen(false); setTimeout(() => { setImportText(""); setImportOpen(true); }, 150); }} className="block w-full px-5 py-4 text-left text-[15px] text-navy font-sans border-none bg-transparent cursor-pointer active:bg-cream">
          Import summary
        </button>
        <div className="h-px bg-mid" />
        <button onClick={() => { setActionOpen(false); setTimeout(() => setConfirmOpen(true), 150); }} className="block w-full px-5 py-4 text-left text-[15px] text-[#C0392B] font-sans border-none bg-transparent cursor-pointer active:bg-cream">
          Delete conversation
        </button>
        <button onClick={() => setActionOpen(false)} className="block w-full px-5 py-4 text-center text-[15px] text-muted font-sans border-none border-t border-mid bg-transparent cursor-pointer" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          Cancel
        </button>
      </Sheet>

      {/* Rename Sheet */}
      <Sheet open={renameOpen} onClose={() => setRenameOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">Rename</h2>
        <div className="px-5 mb-3">
          <input
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="w-full px-3.5 py-3 border-[1.5px] border-mid rounded-[9px] text-[16px] text-navy font-sans bg-cream focus:border-navy"
            autoFocus
          />
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setRenameOpen(false)} className="flex-1 py-3.5 rounded-[9px] bg-cream text-muted border border-mid text-[14px] font-semibold font-sans">Cancel</button>
          <button onClick={handleRename} disabled={!renameName.trim()} className="flex-1 py-3.5 rounded-[9px] bg-navy text-white text-[14px] font-semibold font-sans disabled:bg-mid disabled:text-muted">Save</button>
        </div>
      </Sheet>

      {/* Confirm Delete Sheet */}
      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="mb-5 mt-2">
          <p className="text-[15px] font-semibold text-navy text-center px-5 mb-2">Delete this conversation?</p>
          <p className="text-[13px] text-muted text-center px-6 leading-snug">
            &ldquo;{actionPerson?.name}&rdquo; and all messages will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={handleDelete} className="flex-1 py-3.5 bg-cream border border-[#C0392B] rounded-[10px] text-[14px] font-medium text-[#C0392B] font-sans cursor-pointer">Delete</button>
          <button onClick={() => setConfirmOpen(false)} className="flex-1 py-3.5 bg-cream border border-mid rounded-[10px] text-[14px] font-medium text-navy font-sans cursor-pointer">Cancel</button>
        </div>
      </Sheet>

      {/* Import Summary Sheet */}
      <Sheet open={importOpen} onClose={() => setImportOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">Import a summary</h2>
        <div className="px-5 mb-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-[1px] block mb-1.5">Paste your previous summary</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            placeholder="Paste summary text here…"
            className="w-full px-3.5 py-3 border-[1.5px] border-mid rounded-[9px] text-[15px] text-navy font-sans bg-cream resize-none leading-[1.55]"
          />
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setImportOpen(false)} className="flex-1 py-3.5 rounded-[9px] bg-cream text-muted border border-mid text-[14px] font-semibold font-sans">Cancel</button>
          <button onClick={handleImport} disabled={!importText.trim()} className="flex-1 py-3.5 rounded-[9px] bg-navy text-white text-[14px] font-semibold font-sans disabled:bg-mid disabled:text-muted">Save</button>
        </div>
      </Sheet>

      {/* Profile View */}
      <ProfileView
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        insights={insights}
        onDeleteInsight={handleDeleteInsight}
      />

      {/* About View */}
      <AboutView open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
