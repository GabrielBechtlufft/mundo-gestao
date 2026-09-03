"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Propostas",
    href: "/comprador/home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "Perfil",
    href: "/comprador/perfil",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function CompradorSidebar() {
  const [isMinimized, setIsMinimized] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      style={{
        background: "#03162D",
        border: "1px solid rgba(232, 237, 240, 0.12)",
        borderRadius: "20px",
        width: isMinimized ? "64px" : "200px",
        minHeight: "340px",
        padding: isMinimized ? "20px 8px" : "20px 12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        height: "100%",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease",
      }}
    >
      {/* Toggle */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        style={{
          position: "absolute", top: "16px",
          right: isMinimized ? "50%" : "16px",
          transform: isMinimized ? "translateX(50%)" : "none",
          background: "none", border: "none", cursor: "pointer",
          color: "#00EBCB", padding: "4px",
          transition: "all 0.3s ease", zIndex: 10,
        }}
        aria-label={isMinimized ? "Expandir" : "Minimizar"}
      >
        <img src="/Collect.svg" alt="Toggle" width={18} height={18}
          style={{ transition: "transform 0.3s ease", transform: isMinimized ? "rotate(180deg)" : "none", filter: "brightness(0) invert(1)" }}
        />
      </button>

      <nav className="flex flex-col gap-3 mt-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} title={isMinimized ? item.label : ""}
              style={{
                display: "flex", alignItems: "center",
                justifyContent: isMinimized ? "center" : "flex-start",
                gap: isMinimized ? "0" : "10px",
                padding: "10px 12px", borderRadius: "10px",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#00EBCB" : "#A7B0B8",
                textDecoration: "none",
                transition: "all 0.15s ease",
                background: isActive ? "rgba(0, 235, 203, 0.12)" : "transparent",
                border: isActive ? "1px solid rgba(0, 235, 203, 0.2)" : "1px solid transparent",
                overflow: "hidden", whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: isActive ? "#00EBCB" : "#A7B0B8", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "20px" }}>
                {item.icon}
              </span>
              {!isMinimized && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1, minHeight: "40px" }} />
    </aside>
  );
}