"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Loading() {
  const spinnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spinnerRef.current) {
      gsap.to(spinnerRef.current, {
        rotation: 360,
        duration: 1.5,
        repeat: -1,
        ease: "none",
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div
          ref={spinnerRef}
          className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
        />
        <p className="text-white font-bold text-lg animate-pulse">Carregando...</p>
      </div>
    </div>
  );
}
