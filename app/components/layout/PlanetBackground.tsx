"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PlanetBackground() {
  const planetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (planetRef.current) {
      // Apenas uma entrada suave, sem loop de movimento para evitar lentidão
      gsap.fromTo(
        planetRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 0.5, scale: 1, duration: 1.5, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div
      ref={planetRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: "-15vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "120vw",
        maxWidth: "1600px",
        aspectRatio: "1/1",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.5,
        mixBlendMode: "screen",
      }}
    >
      <Image
        src="/planet.svg"
        alt="Planet Background"
        fill
        className="object-contain drop-shadow-[0_0_100px_rgba(255,255,255,0.3)]"
        priority
      />
    </div>
  );
}
