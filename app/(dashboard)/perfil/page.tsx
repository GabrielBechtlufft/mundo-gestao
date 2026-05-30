"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Sidebar from "@/app/components/layout/Sidebar";
import AvatarUpload from "@/app/components/AvatarUpload";
import { getPerfilAdmin, atualizarPerfilAdmin } from "@/app/actions/perfil";

type Perfil = { id: string; name: string; email: string | null; login: string; image: string | null };

function Campo({ label, value, onChange, placeholder, type = "text", readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</label>
      <input
        type={type} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid", borderColor: readOnly ? "#F3F4F6" : "#E5E7EB", borderRadius: "10px", fontSize: "14px", color: readOnly ? "#9CA3AF" : "#111", background: readOnly ? "#FAFAFA" : "#fff", outline: "none", boxSizing: "border-box" as const }}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#7B00D4"; }}
        onBlur={(e) => { if (!readOnly) e.target.style.borderColor = "#E5E7EB"; }}
      />
    </div>
  );
}

export default function AdminPerfilPage() {
  const { update } = useSession();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [imagemUrl, setImagemUrl] = useState<string>("");

  useEffect(() => {
    getPerfilAdmin().then((res) => {
      if (res.success && res.perfil) {
        const p = res.perfil as Perfil;
        setPerfil(p);
        setNome(p.name ?? "");
        setEmail(p.email ?? "");
        setImagemUrl(p.image ?? "");
      }
      setLoading(false);
    });
  }, []);

  const handleSalvar = async () => {
    setErro(""); setSucesso(false);
    if (!nome.trim()) { setErro("O nome não pode ser vazio."); return; }
    setSalvando(true);
    const res = await atualizarPerfilAdmin({ name: nome, email, image: imagemUrl });
    setSalvando(false);
    if (!res.success) { setErro(res.error || "Erro ao salvar."); return; }
    await update({ image: imagemUrl || null });
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
    setPerfil((p) => p ? { ...p, name: nome, email: email || null, image: imagemUrl || null } : p);
  };

  return (
    <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <h1 style={{ color: "#fff", fontSize: "42px", fontWeight: 700, marginBottom: "28px", marginTop: "8px", letterSpacing: "-0.5px", flexShrink: 0 }}>
        Meu Perfil
      </h1>

      <div style={{ display: "flex", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <Sidebar />

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {loading ? (
            <div style={{ background: "#fff", borderRadius: "20px", padding: "60px", textAlign: "center", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
              <p style={{ color: "#9CA3AF" }}>Carregando...</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho com foto */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", display: "flex", alignItems: "center", gap: "20px" }}>
                <AvatarUpload nome={nome || "A"} imagemAtual={imagemUrl || null} tamanho={88} onUpload={(url) => setImagemUrl(url)} />
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{perfil?.name}</h2>
                  <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "0 0 10px" }}>{perfil?.login}</p>
                  <span style={{ background: "linear-gradient(135deg,#6001D3,#A872F0)", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 14px", borderRadius: "20px" }}>
                    Administrador
                  </span>
                  <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#9CA3AF" }}>Clique na foto para alterar</p>
                </div>
              </div>

              {/* Formulário */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111", margin: 0 }}>Dados da Conta</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Campo label="Nome *" value={nome} onChange={setNome} placeholder="Seu nome" />
                  <Campo label="E-mail" value={email} onChange={setEmail} placeholder="admin@plataforma.com" type="email" />
                </div>
                <Campo label="Login (não editável)" value={perfil?.login ?? ""} readOnly />

                {erro && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 14px", color: "#B91C1C", fontSize: "13px" }}>{erro}</div>}
                {sucesso && <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "10px", padding: "10px 14px", color: "#065F46", fontSize: "13px", fontWeight: 600 }}>✓ Perfil atualizado com sucesso!</div>}

                <button onClick={handleSalvar} disabled={salvando} style={{ padding: "12px 32px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "14px", cursor: salvando ? "not-allowed" : "pointer", opacity: salvando ? 0.7 : 1, alignSelf: "flex-start" }}>
                  {salvando ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>

              {/* Sair */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "20px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                <button onClick={async () => { setLoggingOut(true); await signOut({ callbackUrl: "/login" }); }} disabled={loggingOut}
                  style={{ width: "100%", padding: "14px", background: "transparent", color: "#EF4444", border: "2px solid #FEE2E2", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: loggingOut ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { if (!loggingOut) { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#FCA5A5"; } }}
                  onMouseLeave={(e) => { if (!loggingOut) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#FEE2E2"; } }}>
                  {loggingOut ? "Saindo..." : "Sair da Conta"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}