"use client";

import FullscreenView from "@/components/ui/FullscreenView";
import type { ProfileInsight } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  insights: ProfileInsight[];
  onDeleteInsight: (id: string) => void;
}

export default function ProfileView({ open, onClose, insights, onDeleteInsight }: Props) {
  const grouped: Record<string, ProfileInsight[]> = {};
  insights.forEach((i) => {
    if (!grouped[i.category]) grouped[i.category] = [];
    grouped[i.category].push(i);
  });

  return (
    <FullscreenView open={open} title="☰ Your Profile" onClose={onClose}>
      <div className="px-5 py-7 pb-10">
        {insights.length === 0 ? (
          <p className="text-center text-[14px] text-muted leading-[1.7] pt-10">
            Haven hasn&apos;t saved any insights yet.
            <br /><br />
            They&apos;ll appear here as your conversations develop.
          </p>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-6">
              <div className="text-[10px] font-bold text-muted uppercase tracking-[1.5px] mb-2.5 pb-1.5 border-b border-mid">
                {cat}
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-mid last:border-b-0">
                  <p className="text-[14px] text-navy leading-[1.55] flex-1">{item.text}</p>
                  <button
                    onClick={() => onDeleteInsight(item.id)}
                    className="bg-transparent border-none text-muted text-[18px] cursor-pointer px-1 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </FullscreenView>
  );
}
