"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Buscar ISO",
    href: "/comprador/buscar",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
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
    label: "Conversas",
    href: "/comprador/chat",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
        background: "#ffffff",
        borderRadius: "20px",
        width: isMinimized ? "64px" : "200px",
        minHeight: "340px",
        padding: isMinimized ? "20px 8px" : "20px 12px",
        boxShadow: "0 8px 32px rgba(80,0,160,0.12)",
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
          color: "#7B00D4", padding: "4px",
          transition: "all 0.3s ease", zIndex: 10,
        }}
        aria-label={isMinimized ? "Expandir" : "Minimizar"}
      >
        <img src="/Collect.svg" alt="Toggle" width={18} height={18}
          style={{ transition: "transform 0.3s ease", transform: isMinimized ? "rotate(180deg)" : "none" }}
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
                color: isActive ? "#7B00D4" : "#555",
                textDecoration: "none",
                transition: "all 0.15s ease",
                background: isActive ? "rgba(123,0,212,0.06)" : "transparent",
                overflow: "hidden", whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: isActive ? "#7B00D4" : "#888", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "20px" }}>
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