"use client";

import { useEffect } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Sheet({ open, onClose, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] z-[9999] animate-slideup">
        <div className="w-9 h-1 bg-mid rounded-full mx-auto mt-2.5 mb-[18px]" />
        {children}
      </div>
    </>
  );
}
