"use client";

import { useState } from "react";
import FullscreenView from "@/components/ui/FullscreenView";

interface Props {
  open: boolean;
  label: string;
  text: string;
  loading: boolean;
  onClose: () => void;
}

export default function SummaryView({ open, label, text, loading, onClose }: Props) {
  const [copyLabel, setCopyLabel] = useState("Copy");

  function copy() {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyLabel("Copied");
        setTimeout(() => setCopyLabel("Copy"), 2000);
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy"), 2000);
    }
  }

  function share() {
    if (!text) return;
    if (navigator.share) {
      navigator.share({ title: "Haven Summary", text }).catch(() => {});
    } else {
      copy();
    }
  }

  const actions = (
    <>
      <button
        onClick={copy}
        className={`px-3 py-1.5 text-[12px] font-sans rounded-[8px] border cursor-pointer transition-colors ${
          copyLabel === "Copied"
            ? "bg-sage border-sage text-white"
            : "bg-white/10 border-white/20 text-white"
        }`}
      >
        {copyLabel}
      </button>
      <button
        onClick={share}
        className="px-3 py-1.5 text-[12px] font-sans rounded-[8px] bg-white/10 border border-white/20 text-white cursor-pointer"
      >
        Share
      </button>
    </>
  );

  return (
    <FullscreenView open={open} title="◎ Summary" onClose={onClose} actions={actions} sublabel={label}>
      <div className="px-[18px] py-5 pb-10 text-[15px] leading-[1.75] text-navy whitespace-pre-wrap">
        {loading ? (
          <span className="text-muted italic">Haven is reflecting…</span>
        ) : (
          text || <span className="text-muted italic">No summary yet.</span>
        )}
      </div>
    </FullscreenView>
  );
}
