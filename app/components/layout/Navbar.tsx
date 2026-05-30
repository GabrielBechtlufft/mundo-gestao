"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getSession } from "@/app/actions/auth";
import { signOut } from "next-auth/react";
import { Logo } from "./Logo";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getSession().then(setUser);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };
  return (
    <header
      className="flex items-center justify-between px-10 py-4 z-20 relative shrink-0"
      style={{ background: "transparent" }}
    >
      {/* Logo + texto */}
      <Link href="/home" className="no-underline transition-transform active:scale-95">
        <Logo size="sm" />
      </Link>

      {/* Links centrais */}
      <nav className="flex items-center gap-15">
        <nav className="flex items-center gap-8">
          <Link
            href="/propostas"
            className="text-white text-sm font-medium hover:text-white/80 transition-colors duration-200"
            style={{ textDecoration: "none" }}
          >
            Minhas Propostas
          </Link>
          <Link
            href="/aprovacao"
            className="text-white text-sm font-medium hover:text-white/80 transition-colors duration-200"
            style={{ textDecoration: "none" }}
          >
            Contratos Finalizados
          </Link>
        </nav>

        {/* Avatar */}
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center justify-center rounded-full overflow-hidden transition-opacity hover:opacity-80"
          style={{
            width: "48px",
            height: "48px",
            background: "rgba(200,200,220,0.85)",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Perfil do usuário"
          id="navbar-avatar-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </nav>

      {/* Overlay */}
      {profileOpen && (
        <div
          onClick={() => setProfileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.18)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Profile Panel */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          right: "40px",
          width: "300px",
          background: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 24px 80px rgba(80,0,160,0.22)",
          zIndex: 50,
          padding: "32px 28px 24px",
          transform: profileOpen ? "translateY(0) scale(1)" : "translateY(-16px) scale(0.95)",
          opacity: profileOpen ? 1 : 0,
          pointerEvents: profileOpen ? "auto" : "none",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "top right",
        }}
      >
        {/* Close */}
        <button
          onClick={() => setProfileOpen(false)}
          style={{
            position: "absolute", top: "14px", right: "14px",
            background: "#F3F4F6", border: "none", cursor: "pointer",
            borderRadius: "50%", width: "28px", height: "28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#888", fontSize: "14px", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#E5E7EB"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#F3F4F6"; }}
          aria-label="Fechar painel"
        >
          ✕
        </button>

        {/* Avatar */}
        <div style={{
          width: "72px", height: "72px", borderRadius: "22px",
          background: "linear-gradient(135deg, #6001D3, #A872F0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "30px", color: "#fff", margin: "0 auto 16px",
          boxShadow: "0 8px 24px rgba(96,1,211,0.25)",
        }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
        </div>

        {/* Name & role */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#111", marginBottom: "4px" }}>
            {user?.name || "Administrador"}
          </div>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "2px" }}>
            {user?.login || "—"}
          </div>
          <span style={{
            display: "inline-block", marginTop: "6px",
            background: "linear-gradient(135deg, #6001D3, #A872F0)",
            color: "#fff", fontSize: "11px", fontWeight: 700,
            padding: "3px 12px", borderRadius: "20px", letterSpacing: "0.04em",
          }}>
            Admin
          </span>
        </div>

        {/* Info rows */}
        <div style={{ borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6", padding: "12px 0", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ fontSize: "13px", color: "#888", fontWeight: 600 }}>Função</span>
            <span style={{ fontSize: "13px", color: "#6001D3", fontWeight: 700 }}>Administrador</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ fontSize: "13px", color: "#888", fontWeight: 600 }}>Status</span>
            <span style={{ fontSize: "13px", color: "#22C55E", fontWeight: 700 }}>● Ativo</span>
          </div>
        </div>

        {/* Logout button */}
        <button
          id="btn-sair-admin"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: "100%", padding: "14px",
            background: loggingOut ? "#FEE2E2" : "transparent",
            color: "#EF4444", border: "2px solid #FEE2E2",
            borderRadius: "14px", fontSize: "14px", fontWeight: 700,
            cursor: loggingOut ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
          onMouseEnter={(e) => { if (!loggingOut) { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#FCA5A5"; } }}
          onMouseLeave={(e) => { if (!loggingOut) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#FEE2E2"; } }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {loggingOut ? "Saindo..." : "Sair da Conta"}
        </button>
      </div>
    </header>
  );
}
