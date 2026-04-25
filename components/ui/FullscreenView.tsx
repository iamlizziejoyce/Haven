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
    <div className="fixed inset-0 bg-cream z-[9999] flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-dark flex items-center justify-between flex-shrink-0">
        <span className="font-serif text-gold text-[15px] tracking-wide">{title}</span>
        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[#4A6480] text-[20px] cursor-pointer px-1 leading-none"
          >
            ✕
          </button>
        </div>
      </div>
      {sublabel && (
        <div className="px-[18px] pt-3 text-[10px] text-muted uppercase tracking-[1px] font-semibold flex-shrink-0">
          {sublabel}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
