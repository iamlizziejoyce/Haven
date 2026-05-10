"use client";

interface FullscreenViewProps {
  open: boolean;
  title: string;
  onClose: () => void;
  actions?: React.ReactNode;
  sublabel?: string;
  children: React.ReactNode;
}

export default function FullscreenView({
  open,
  title,
  onClose,
  actions,
  sublabel,
  children,
}: FullscreenViewProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #F5E0D0 0%, #F7EDE4 40%, #FAF0E8 100%)" }}
    >
      <div className="px-4 pt-12 pb-3 flex items-center justify-between flex-shrink-0">
        <span className="font-sans font-semibold text-navy text-[16px]">{title}</span>
        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-navy/50 text-[16px] cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>
      {sublabel && (
        <div className="px-5 pt-1 pb-2 text-[11px] text-muted uppercase tracking-[1px] font-semibold flex-shrink-0">
          {sublabel}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
