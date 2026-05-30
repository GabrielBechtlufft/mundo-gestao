"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95, y: 30 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.7, 
          ease: "back.out(1.7)", 
          delay: 0.1 
        }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      {children}
    </div>
  );
}
