"use client";

import FullscreenView from "@/components/ui/FullscreenView";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AboutView({ open, onClose }: Props) {
  return (
    <FullscreenView open={open} title="About Haven" onClose={onClose}>
      <div className="px-5 py-6 pb-16">

        {/* Logo block */}
        <div className="bg-white/60 backdrop-blur border border-white/80 rounded-[20px] p-6 text-center mb-5 shadow-sm">
          <h2 className="font-sans text-[32px] font-semibold text-navy tracking-[8px] mb-1">HAVEN</h2>
          <p className="text-[13px] text-muted italic">a relationship-aware personal companion</p>
        </div>

        {/* Sections */}
        {[
          {
            title: "What Haven is",
            body: [
              "Haven is a private space to think through the things that affect your relationships — including the things that are really about you.",
              "It's modelled on a skilled therapist who knows you well and is genuinely on your side, while being honest about things you might not want to hear.",
            ],
          },
          {
            title: "One conversation per person",
            body: [
              "Each person in your life gets their own continuous conversation. Haven builds a picture over time — the more you talk, the more useful it becomes.",
            ],
          },
          {
            title: "Your profile",
            body: [
              "As your conversations develop, Haven builds a picture of you. These insights inform every conversation. You can view and manage them from the home screen.",
            ],
          },
          {
            title: "Privacy",
            body: [
              "Your conversations are stored securely in the cloud, encrypted at rest. They follow you when you sign in on any device. Nothing is shared with anyone else.",
            ],
          },
        ].map((section) => (
          <div
            key={section.title}
            className="bg-white/60 backdrop-blur border border-white/80 rounded-[20px] px-5 py-4 mb-3 shadow-sm"
          >
            <h3 className="text-[11px] font-bold text-gold uppercase tracking-[1.5px] mb-2">
              {section.title}
            </h3>
            {section.body.map((p, i) => (
              <p key={i} className="text-[14px] text-navy leading-[1.7] mb-1 last:mb-0">
                {p}
              </p>
            ))}
          </div>
        ))}
      </div>
    </FullscreenView>
  );
}
