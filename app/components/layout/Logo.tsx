"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  // Predefined scale for different sizes to ensure consistency
  const scales = {
    sm: { icon: 38, title: "17px", subtitle: "8.5px", gap: "gap-3" },
    md: { icon: 48, title: "22px", subtitle: "10px", gap: "gap-4" },
    lg: { icon: 64, title: "28px", subtitle: "12px", gap: "gap-5" },
  };

  const { icon, title, subtitle, gap } = scales[size];

  return (
    <div className={`flex items-center ${gap} ${className} select-none`}>
      <div className="relative shrink-0">
        <Image
          src="/logo.svg"
          alt="Logo Mundo de Gestão"
          width={icon}
          height={icon}
          className="object-contain drop-shadow-sm"
          priority
        />
      </div>
      <div className="flex flex-col justify-center">
        <div 
          className="font-extrabold tracking-tight text-white uppercase m-0 leading-none flex items-start"
          style={{ fontSize: title }}
        >
          MUNDO DE GESTÃO 
          <span className="font-bold ml-1" style={{ fontSize: '55%', marginTop: '-2px' }}>®</span>
        </div>
        <p 
          className="font-bold tracking-[0.22em] text-white/80 uppercase m-0 mt-1 whitespace-nowrap"
          style={{ fontSize: subtitle }}
        >
          NORMAS ISO NA NOVA ERA DIGITAL
        </p>
      </div>
    </div>
  );
}
