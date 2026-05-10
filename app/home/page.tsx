export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/home/HomeClient";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const { data: insights } = await supabase
    .from("profile_insights")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // Get message counts per person
  const messageCounts: Record<string, number> = {};
  if (people?.length) {
    for (const p of people) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("person_id", p.id);
      messageCounts[p.id] = count ?? 0;
    }
  }

  // Pending incoming link requests
  const { data: pendingLinks } = await supabase
    .from("account_links")
    .select("id, requester_id")
    .eq("recipient_id", user.id)
    .eq("status", "pending");

  const pendingRequests: { id: string; name: string }[] = [];
  for (const link of pendingLinks ?? []) {
    const { data: rp } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", link.requester_id)
      .single();
    pendingRequests.push({ id: link.id, name: rp?.display_name ?? "Someone" });
  }

  return (
    <HomeClient
      displayName={profile?.display_name ?? "there"}
      initialPeople={people ?? []}
      messageCounts={messageCounts}
      initialInsights={insights ?? []}
      pendingRequests={pendingRequests}
    />
  );
}
