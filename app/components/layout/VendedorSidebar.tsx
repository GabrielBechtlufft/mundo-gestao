"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const allNavItems = [
  {
    label: "Minhas Listagens",
    href: "/vendedor/listagens",
    roles: ["VENDEDOR"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Minhas Propostas",
    href: "/vendedor/propostas",
    roles: ["VENDEDOR"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "Equipe",
    href: "/vendedor/funcionarios",
    roles: ["VENDEDOR"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Conversas",
    href: "/vendedor/chat",
    roles: ["VENDEDOR", "FUNCIONARIO"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Perfil",
    href: "/vendedor/perfil",
    roles: ["VENDEDOR"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function VendedorSidebar({ role }: { role?: string }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const pathname = usePathname();
  const navItems = allNavItems.filter((item) => !role || item.roles.includes(role));

  return (
    <>
      {/* Overlay */}
      {/* Sidebar aside */}

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
        {/* Toggle button */}
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
          <img
            src="/Collect.svg"
            alt="Toggle"
            width={18}
            height={18}
            style={{
              transition: "transform 0.3s ease",
              transform: isMinimized ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {/* Nav items */}
        <nav className="flex flex-col gap-3 mt-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isMinimized ? item.label : ""}
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
                <span style={{
                  color: isActive ? "#7B00D4" : "#888",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minWidth: "20px",
                }}>
                  {item.icon}
                </span>
                {!isMinimized && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: "40px" }} />


      </aside>
    </>
  );
}
