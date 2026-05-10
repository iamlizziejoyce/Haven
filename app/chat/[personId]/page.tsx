export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatClient from "@/components/chat/ChatClient";

export default async function ChatPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("id", personId)
    .eq("user_id", user.id)
    .single();
  if (!person) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("person_id", personId)
    .order("created_at", { ascending: true });

  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .eq("person_id", personId)
    .order("created_at", { ascending: true });

  return (
    <ChatClient
      person={person}
      displayName={profile?.display_name ?? "there"}
      initialMessages={messages ?? []}
      initialSummaries={summaries ?? []}
    />
  );
}
