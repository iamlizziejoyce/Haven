"use client";

import FullscreenView from "@/components/ui/FullscreenView";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AboutView({ open, onClose }: Props) {
  return (
    <FullscreenView open={open} title="◈ About Haven" onClose={onClose}>
      <div className="px-5 py-7 pb-10">
        <div className="text-center mb-7">
          <span className="text-gold text-[28px] block mb-2.5">◈</span>
          <span className="font-serif text-[28px] font-semibold text-navy tracking-[8px] block">HAVEN</span>
          <span className="text-[12px] text-muted italic block mt-1.5">a relationship-aware personal companion</span>
        </div>

        <section className="mb-6">
          <h3 className="text-[11px] font-bold text-muted uppercase tracking-[1.5px] mb-2">What Haven is</h3>
          <p className="text-[14px] text-navy leading-[1.7] mb-2">
            Haven is a private space to think through the things that affect your relationships — including the things that are really about you.
          </p>
          <p className="text-[14px] text-navy leading-[1.7]">
            It&apos;s modelled on a skilled therapist who knows you well and is genuinely on your side, while being honest about things you might not want to hear.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-[11px] font-bold text-muted uppercase tracking-[1.5px] mb-2">One conversation per person</h3>
          <p className="text-[14px] text-navy leading-[1.7]">
            Each person in your life gets their own continuous conversation. Haven builds a picture over time — the more you talk, the more useful it becomes.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-[11px] font-bold text-muted uppercase tracking-[1.5px] mb-2">Your profile</h3>
          <p className="text-[14px] text-navy leading-[1.7]">
            As your conversations develop, Haven builds a picture of you. These insights inform every conversation. You can view and manage them from the home screen.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-[11px] font-bold text-muted uppercase tracking-[1.5px] mb-2">Privacy</h3>
          <p className="text-[14px] text-navy leading-[1.7]">
            Your conversations are stored securely in the cloud, encrypted at rest. They follow you when you sign in on any device. Nothing is shared with anyone else.
          </p>
        </section>
      </div>
    </FullscreenView>
  );
}
