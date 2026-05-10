"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

export default function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 200);
    }, 4000);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-[100px] left-1/2 -translate-x-1/2 bg-[#1A0808] text-[#FF9090] px-4 py-2.5 rounded-[8px] text-[12px] max-w-[88%] text-center z-[10000] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {message}
    </div>
  );
}
