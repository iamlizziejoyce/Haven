"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Person, ProfileInsight } from "@/lib/types";
import Sheet from "@/components/ui/Sheet";
import Toast from "@/components/ui/Toast";
import ProfileView from "@/components/home/ProfileView";
import AboutView from "@/components/home/AboutView";

interface Props {
  displayName: string;
  initialPeople: Person[];
  messageCounts: Record<string, number>;
  initialInsights: ProfileInsight[];
  pendingRequests: { id: string; name: string }[];
  connectedNames: string[];
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

function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 18) return `Hey, ${name}`;
  return `Evening, ${name}`;
}

export default function HomeClient({ displayName, initialPeople, messageCounts, initialInsights, pendingRequests: initialPendingRequests, connectedNames }: Props) {
  const router = useRouter();

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

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectEmail, setConnectEmail] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);

  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests);

  const [toast, setToast] = useState("");

  async function handleAddPerson() {
    if (!addName.trim() || addLoading) return;
    setAddLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("people")
      .insert({ name: addName.trim(), user_id: user?.id })
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
    const supabase = createClient();
    const { error } = await supabase.from("people").update({ name: renameName.trim() }).eq("id", actionPerson.id);
    if (error) { setToast("Something went wrong."); return; }
    setPeople((prev) => prev.map((p) => p.id === actionPerson.id ? { ...p, name: renameName.trim() } : p));
    setRenameOpen(false);
    setActionPerson(null);
  }

  async function handleDelete() {
    if (!actionPerson) return;
    const supabase = createClient();
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
    const supabase = createClient();
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

  async function handleConnect() {
    if (!connectEmail.trim() || connectLoading) return;
    setConnectLoading(true);
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: connectEmail.trim() }),
    });
    const data = await res.json();
    setConnectLoading(false);
    if (!res.ok) { setToast(data.error ?? "Something went wrong."); return; }
    setConnectOpen(false);
    setConnectEmail("");
    setToast(`Request sent to ${data.recipientName}.`);
  }

  async function handleLinkResponse(id: string, action: "accept" | "reject") {
    await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    if (action === "accept") setToast("Connected!");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  async function handleDeleteInsight(id: string) {
    await fetch("/api/insights", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="min-h-dvh w-full flex flex-col" style={{ background: "linear-gradient(160deg, #F5E0D0 0%, #F7EDE4 40%, #FAF0E8 100%)" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-gold text-[16px]">◈</span>
          <span className="font-sans text-[16px] font-semibold text-navy/60 tracking-[6px]">HAVEN</span>
          <div className="ml-auto flex gap-3">
            {insights.length > 0 && (
              <button onClick={() => setProfileOpen(true)} className="text-[12px] text-navy/50 font-medium">
                Profile
              </button>
            )}
            <button onClick={() => setAboutOpen(true)} className="text-[12px] text-navy/50 font-medium">
              About
            </button>
            <button onClick={() => { setConnectEmail(""); setConnectOpen(true); }} className="text-[12px] text-navy/50 font-medium">
              Connect
            </button>
            <button onClick={handleSignOut} className="text-[12px] text-navy/50 font-medium">
              Sign out
            </button>
          </div>
        </div>

        {/* Big greeting */}
        <h1 className="font-sans text-[42px] font-bold text-navy leading-[1.1] mb-1">
          {greeting(displayName)}
        </h1>
        <p className="text-[14px] text-muted">
          {people.length === 0
            ? "Who would you like to talk about today?"
            : "Who's on your mind?"}
        </p>
      </div>

      {/* Pending connection requests */}
      {pendingRequests.length > 0 && (
        <div className="px-4 pb-2 flex flex-col gap-2">
          {pendingRequests.map((req) => (
            <div key={req.id} className="bg-white/70 backdrop-blur border border-white/80 rounded-[16px] px-4 py-3 flex items-center justify-between shadow-sm">
              <p className="text-[13px] text-navy font-medium"><span className="font-semibold">{req.name}</span> wants to connect on Haven</p>
              <div className="flex gap-2 ml-3 flex-shrink-0">
                <button onClick={() => handleLinkResponse(req.id, "accept")} className="text-[12px] font-semibold text-white bg-navy rounded-full px-3 py-1">Accept</button>
                <button onClick={() => handleLinkResponse(req.id, "reject")} className="text-[12px] font-semibold text-muted bg-cream border border-mid rounded-full px-3 py-1">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* People list */}
      <div className="flex-1 px-4 pb-4 flex flex-col gap-3">
        {people.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-8">
            <div className="w-16 h-16 rounded-full bg-white/60 border border-white/80 flex items-center justify-center mb-4 shadow-sm">
              <span className="text-gold text-[24px]">◈</span>
            </div>
            <p className="text-[15px] font-medium text-navy mb-2">No conversations yet</p>
            <p className="text-[13px] text-muted leading-[1.7]">
              Each conversation is a private space to think through a relationship — a partner, family member, friend, or colleague.
            </p>
          </div>
        ) : (
          people.map((p) => {
            const isConnected = connectedNames.includes(p.name.toLowerCase());
            return (
            <div
              key={p.id}
              onClick={() => router.push(`/chat/${p.id}`)}
              className="bg-white/65 backdrop-blur border border-white/80 rounded-[20px] px-5 py-4 cursor-pointer flex items-center justify-between shadow-sm active:bg-white/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-peach flex items-center justify-center flex-shrink-0 ${isConnected ? "ring-2 ring-gold/60 ring-offset-1" : "border border-peach-dark/30"}`}>
                  <span className="font-sans text-[18px] text-navy/70 font-semibold leading-none">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-navy">{p.name}</p>
                  <p className="text-[12px] text-muted mt-0.5">
                    {isConnected
                      ? <><span className="text-gold font-medium">connected · </span>{counts[p.id] ?? 0} messages</>
                      : <>{p.updated_at ? `${formatDate(p.updated_at)} · ` : ""}{counts[p.id] ?? 0} messages</>
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setActionPerson(p); setActionOpen(true); }}
                className="w-8 h-8 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-muted text-[16px] flex-shrink-0"
              >
                ···
              </button>
            </div>
            );
          })
        )}
      </div>

      {/* Add button — fixed bottom */}
      <div className="px-4 pb-6" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <button
          onClick={() => { setAddName(""); setAddOpen(true); }}
          className="w-full py-4 bg-navy text-white rounded-[20px] text-[15px] font-semibold shadow-md active:opacity-90 transition-opacity"
        >
          + Start a conversation
        </button>
      </div>

      {/* Add Person Sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="text-[17px] font-semibold text-navy mb-1 px-5">Who would you like to talk about?</h2>
        <p className="text-[13px] text-muted px-5 mb-4">Enter their name to start a private thread.</p>
        <div className="px-5 mb-3">
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addName.trim() && handleAddPerson()}
            placeholder="Their name"
            autoComplete="off"
            className="w-full px-4 py-3.5 border-[1.5px] border-mid rounded-[14px] text-[16px] text-navy font-sans bg-cream focus:border-navy placeholder-muted"
            autoFocus
          />
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setAddOpen(false)} className="flex-1 py-3.5 rounded-[14px] bg-cream text-muted border border-mid text-[14px] font-semibold font-sans">
            Cancel
          </button>
          <button
            onClick={handleAddPerson}
            disabled={!addName.trim() || addLoading}
            className="flex-1 py-3.5 rounded-[14px] bg-navy text-white text-[14px] font-semibold font-sans disabled:bg-mid disabled:text-muted"
          >
            {addLoading ? "…" : "Begin"}
          </button>
        </div>
      </Sheet>

      {/* Action Sheet */}
      <Sheet open={actionOpen} onClose={() => setActionOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">{actionPerson?.name}</h2>
        <button onClick={() => { setActionOpen(false); setTimeout(() => { setRenameName(actionPerson?.name ?? ""); setRenameOpen(true); }, 150); }} className="block w-full px-5 py-4 text-left text-[15px] text-navy font-sans border-none bg-transparent cursor-pointer active:bg-cream">Rename</button>
        <div className="h-px bg-mid mx-5" />
        <button onClick={() => { setActionOpen(false); setTimeout(() => { setImportText(""); setImportOpen(true); }, 150); }} className="block w-full px-5 py-4 text-left text-[15px] text-navy font-sans border-none bg-transparent cursor-pointer active:bg-cream">Import summary</button>
        <div className="h-px bg-mid mx-5" />
        <button onClick={() => { setActionOpen(false); setTimeout(() => setConfirmOpen(true), 150); }} className="block w-full px-5 py-4 text-left text-[15px] text-[#C0392B] font-sans border-none bg-transparent cursor-pointer active:bg-cream">Delete conversation</button>
        <button onClick={() => setActionOpen(false)} className="block w-full px-5 py-4 text-center text-[15px] text-muted font-sans border-none border-t border-mid bg-transparent cursor-pointer" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>Cancel</button>
      </Sheet>

      {/* Rename Sheet */}
      <Sheet open={renameOpen} onClose={() => setRenameOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">Rename</h2>
        <div className="px-5 mb-3">
          <input type="text" value={renameName} onChange={(e) => setRenameName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} className="w-full px-4 py-3.5 border-[1.5px] border-mid rounded-[14px] text-[16px] text-navy font-sans bg-cream focus:border-navy" autoFocus />
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setRenameOpen(false)} className="flex-1 py-3.5 rounded-[14px] bg-cream text-muted border border-mid text-[14px] font-semibold font-sans">Cancel</button>
          <button onClick={handleRename} disabled={!renameName.trim()} className="flex-1 py-3.5 rounded-[14px] bg-navy text-white text-[14px] font-semibold font-sans disabled:bg-mid disabled:text-muted">Save</button>
        </div>
      </Sheet>

      {/* Confirm Delete Sheet */}
      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="mb-5 mt-2">
          <p className="text-[15px] font-semibold text-navy text-center px-5 mb-2">Delete this conversation?</p>
          <p className="text-[13px] text-muted text-center px-6 leading-snug">&ldquo;{actionPerson?.name}&rdquo; and all messages will be permanently deleted.</p>
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={handleDelete} className="flex-1 py-3.5 bg-cream border border-[#C0392B] rounded-[14px] text-[14px] font-medium text-[#C0392B] font-sans cursor-pointer">Delete</button>
          <button onClick={() => setConfirmOpen(false)} className="flex-1 py-3.5 bg-cream border border-mid rounded-[14px] text-[14px] font-medium text-navy font-sans cursor-pointer">Cancel</button>
        </div>
      </Sheet>

      {/* Import Summary Sheet */}
      <Sheet open={importOpen} onClose={() => setImportOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">Import a summary</h2>
        <div className="px-5 mb-3">
          <label className="text-[10px] font-bold text-muted uppercase tracking-[1px] block mb-1.5">Paste your previous summary</label>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={6} placeholder="Paste summary text here…" className="w-full px-4 py-3 border-[1.5px] border-mid rounded-[14px] text-[15px] text-navy font-sans bg-cream resize-none leading-[1.55]" />
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setImportOpen(false)} className="flex-1 py-3.5 rounded-[14px] bg-cream text-muted border border-mid text-[14px] font-semibold font-sans">Cancel</button>
          <button onClick={handleImport} disabled={!importText.trim()} className="flex-1 py-3.5 rounded-[14px] bg-navy text-white text-[14px] font-semibold font-sans disabled:bg-mid disabled:text-muted">Save</button>
        </div>
      </Sheet>

      {/* Connect Sheet */}
      <Sheet open={connectOpen} onClose={() => setConnectOpen(false)}>
        <h2 className="text-[17px] font-semibold text-navy mb-1 px-5">Connect with someone</h2>
        <p className="text-[13px] text-muted px-5 mb-4 leading-snug">Enter their email address. If they have a Haven account, they'll get a request to connect. Once accepted, Haven will use shared context to give you both more informed support.</p>
        <div className="px-5 mb-3">
          <input
            type="email"
            value={connectEmail}
            onChange={(e) => setConnectEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connectEmail.trim() && handleConnect()}
            placeholder="Their email address"
            autoComplete="off"
            className="w-full px-4 py-3.5 border-[1.5px] border-mid rounded-[14px] text-[16px] text-navy font-sans bg-cream focus:border-navy placeholder-muted"
            autoFocus
          />
        </div>
        <div className="flex gap-2.5 px-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          <button onClick={() => setConnectOpen(false)} className="flex-1 py-3.5 rounded-[14px] bg-cream text-muted border border-mid text-[14px] font-semibold font-sans">
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={!connectEmail.trim() || connectLoading}
            className="flex-1 py-3.5 rounded-[14px] bg-navy text-white text-[14px] font-semibold font-sans disabled:bg-mid disabled:text-muted"
          >
            {connectLoading ? "…" : "Send request"}
          </button>
        </div>
      </Sheet>

      <ProfileView open={profileOpen} onClose={() => setProfileOpen(false)} insights={insights} onDeleteInsight={handleDeleteInsight} />
      <AboutView open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
