"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";
import AvatarUpload from "@/app/components/AvatarUpload";
import { getPerfilVendedor, atualizarPerfilVendedor } from "@/app/actions/perfil";
import { trocarSenhaAutenticado } from "@/app/actions/senha";

type Perfil = {
  id: string; name: string; email: string | null; login: string; image: string | null;
  razaoSocial: string | null; cnpj: string | null;
  validadeCertificado: string | null; isosVendidas: string;
  rankTier: string; rankScore: number; statusVendedor: string;
};

const RANK_STYLE: Record<string, { icon: string; label: string; bg: string; color: string; border: string }> = {
  BRONZE:  { icon: "🥉", label: "Bronze",  bg: "rgba(205,127,50,0.15)", color: "#CD7F32", border: "#CD7F32" },
  PRATA:   { icon: "🥈", label: "Prata",   bg: "rgba(232,237,240,0.1)", color: "#E8EDF0", border: "#A7B0B8" },
  OURO:    { icon: "🥇", label: "Ouro",    bg: "rgba(255,215,0,0.12)", color: "#FFD700", border: "#FFD700" },
  PLATINA: { icon: "💎", label: "Platina", bg: "rgba(0,235,203,0.12)", color: "#00EBCB", border: "#00EBCB" },
};

function Campo({ label, value, onChange, placeholder, type = "text", readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#E8EDF0", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </label>
      <input
        type={type} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly} placeholder={placeholder}
        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid", borderColor: readOnly ? "rgba(232,237,240,0.08)" : "rgba(232, 237, 240, 0.18)", borderRadius: "10px", fontSize: "14px", color: readOnly ? "#A7B0B8" : "#FFFFFF", background: readOnly ? "#020D1D" : "#020D1D", outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s" }}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#00EBCB"; }}
        onBlur={(e) => { if (!readOnly) e.target.style.borderColor = "rgba(232, 237, 240, 0.18)"; }}
      />
    </div>
  );
}

function certStatus(validadeIso: string | null): { label: string; color: string; bg: string } {
  if (!validadeIso) return { label: "Não informado", color: "#A7B0B8", bg: "rgba(232,237,240,0.08)" };
  const dias = Math.ceil((new Date(validadeIso).getTime() - Date.now()) / 86400000);
  if (dias < 0) return { label: `Expirado há ${Math.abs(dias)} dia(s)`, color: "#F87171", bg: "rgba(239,68,68,0.15)" };
  if (dias <= 30) return { label: `Expira em ${dias} dia(s)`, color: "#F59E0B", bg: "rgba(245,158,11,0.15)" };
  return { label: `Válido — expira em ${dias} dia(s)`, color: "#00EBCB", bg: "rgba(0,235,203,0.12)" };
}

export default function PerfilPage() {
  const { update } = useSession();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [nome, setNome] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [imagemUrl, setImagemUrl] = useState<string>("");

  const [mostrarModalSenha, setMostrarModalSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [sucessoSenha, setSucessoSenha] = useState(false);

  useEffect(() => {
    getPerfilVendedor().then((res) => {
      if (res.success && res.perfil) {
        const p = res.perfil as Perfil;
        setPerfil(p);
        setNome(p.name ?? "");
        setRazaoSocial(p.razaoSocial ?? "");
        setCnpj(p.cnpj ?? "");
        setEmail(p.email ?? "");
        setImagemUrl(p.image ?? "");
      }
      setLoading(false);
    });
  }, []);

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha(""); setSucessoSenha(false);
    if (novaSenha !== confirmarSenha) { setErroSenha("As senhas não coincidem."); return; }
    setSalvandoSenha(true);
    const res = await trocarSenhaAutenticado(senhaAtual, novaSenha);
    setSalvandoSenha(false);
    if (!res.success) { setErroSenha(res.error || "Erro ao trocar senha."); return; }
    setSucessoSenha(true);
    setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
    setTimeout(() => { setSucessoSenha(false); setMostrarModalSenha(false); }, 2000);
  };

  const handleSalvar = async () => {
    setErro(""); setSucesso(false);
    if (!nome.trim()) { setErro("O nome não pode ser vazio."); return; }
    setSalvando(true);
    const res = await atualizarPerfilVendedor({ name: nome, razaoSocial, cnpj, email, image: imagemUrl });
    setSalvando(false);
    if (!res.success) { setErro(res.error || "Erro ao salvar."); return; }
    await update({ image: imagemUrl || null });
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
    setPerfil((p) => p ? { ...p, name: nome, razaoSocial: razaoSocial || null, cnpj: cnpj || null, email: email || null, image: imagemUrl || null } : p);
  };

  const rank = RANK_STYLE[perfil?.rankTier ?? "BRONZE"] ?? RANK_STYLE.BRONZE;
  const cert = certStatus(perfil?.validadeCertificado ?? null);
  const isos = perfil?.isosVendidas ? perfil.isosVendidas.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column", fontFamily: "var(--font-montserrat), sans-serif", color: "#FFFFFF" }}>
      <div style={{ marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <h1 style={{ color: "#FFFFFF", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Meu Perfil</h1>
        <p style={{ color: "#A7B0B8", fontSize: "14px", margin: 0, fontWeight: 400 }}>Gerencie as informações da sua certificadora</p>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <VendedorSidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "60px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <p style={{ color: "#00EBCB", fontWeight: 500 }}>Carregando...</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho com foto */}
              <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: "20px" }}>
                <AvatarUpload nome={nome || "C"} imagemAtual={imagemUrl || null} tamanho={88} onUpload={(url) => setImagemUrl(url)} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 4px" }}>{perfil?.name}</h2>
                  <p style={{ fontSize: "13px", color: "#A7B0B8", margin: "0 0 10px" }}>{perfil?.login}</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: rank.bg, border: `1.5px solid ${rank.border}`, borderRadius: "20px", padding: "3px 10px" }}>
                      <span>{rank.icon}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: rank.color }}>{rank.label} · {Math.round(perfil?.rankScore ?? 0)} pts</span>
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: perfil?.statusVendedor === "APROVADO" ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)", color: perfil?.statusVendedor === "APROVADO" ? "#22C55E" : "#F59E0B" }}>
                      {perfil?.statusVendedor === "APROVADO" ? "● Ativa" : perfil?.statusVendedor}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#A7B0B8" }}>Clique na foto para alterar</p>
                </div>
              </div>

              {/* Formulário */}
              <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 20px" }}>Dados da Empresa</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <Campo label="Nome *" value={nome} onChange={setNome} placeholder="Nome de exibição" />
                  <Campo label="Razão Social" value={razaoSocial} onChange={setRazaoSocial} placeholder="Razão social completa" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <Campo label="CNPJ" value={cnpj} onChange={setCnpj} placeholder="00.000.000/0001-00" />
                  <Campo label="E-mail" value={email} onChange={setEmail} placeholder="contato@empresa.com.br" type="email" />
                </div>
                <Campo label="Login (não editável)" value={perfil?.login ?? ""} readOnly />

                {erro && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "10px 14px", color: "#F87171", fontSize: "13px", marginTop: "16px" }}>{erro}</div>}
                {sucesso && <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", padding: "10px 14px", color: "#22C55E", fontSize: "13px", fontWeight: 600, marginTop: "16px" }}>✓ Perfil atualizado com sucesso!</div>}

                <button onClick={handleSalvar} disabled={salvando} style={{ marginTop: "20px", padding: "12px 32px", background: "#00EBCB", color: "#020D1D", border: "none", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: salvando ? "not-allowed" : "pointer", opacity: salvando ? 0.7 : 1, boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}>
                  {salvando ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>

              {/* Certificado */}
              <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 20px" }}>Certificado & ISOs Autorizadas</h3>
                <div style={{ background: cert.bg, borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: cert.color, textTransform: "uppercase", letterSpacing: "0.4px" }}>Validade do Certificado ISO</p>
                  <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: cert.color }}>
                    {perfil?.validadeCertificado ? new Date(perfil.validadeCertificado).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Não informado"}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: cert.color, opacity: 0.8 }}>{cert.label}</p>
                </div>
                {isos.length > 0 ? (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {isos.map((iso) => <span key={iso} style={{ background: "rgba(0, 235, 203, 0.12)", color: "#00EBCB", border: "1px solid rgba(0, 235, 203, 0.25)", fontSize: "13px", fontWeight: 600, padding: "6px 14px", borderRadius: "10px" }}>{iso}</span>)}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#A7B0B8", margin: 0 }}>Nenhuma ISO autorizada. Entre em contato com o administrador.</p>
                )}
                <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#A7B0B8" }}>Para atualizar o certificado ou ISOs, contate o administrador.</p>
              </div>

              {/* Segurança */}
              <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 16px" }}>Segurança</h3>
                {!mostrarModalSenha ? (
                  <button onClick={() => { setMostrarModalSenha(true); setErroSenha(""); setSucessoSenha(false); }}
                    style={{ padding: "10px 24px", background: "transparent", color: "#00EBCB", border: "1.5px solid rgba(0, 235, 203, 0.4)", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                    Trocar senha
                  </button>
                ) : (
                  <form onSubmit={handleTrocarSenha} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {erroSenha && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "10px 14px", color: "#F87171", fontSize: "13px" }}>{erroSenha}</div>}
                    {sucessoSenha && <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", padding: "10px 14px", color: "#22C55E", fontSize: "13px", fontWeight: 600 }}>✓ Senha alterada com sucesso!</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#E8EDF0", marginBottom: "6px", textTransform: "uppercase" }}>Senha atual</label>
                        <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required placeholder="••••••"
                          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid rgba(232, 237, 240, 0.18)", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const, background: "#020D1D", color: "#FFFFFF" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#E8EDF0", marginBottom: "6px", textTransform: "uppercase" }}>Nova senha</label>
                        <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required placeholder="Mín. 6 caracteres"
                          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid rgba(232, 237, 240, 0.18)", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const, background: "#020D1D", color: "#FFFFFF" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#E8EDF0", marginBottom: "6px", textTransform: "uppercase" }}>Confirmar</label>
                        <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required placeholder="Repita a senha"
                          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid rgba(232, 237, 240, 0.18)", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const, background: "#020D1D", color: "#FFFFFF" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" disabled={salvandoSenha}
                        style={{ padding: "10px 24px", background: "#00EBCB", color: "#020D1D", border: "none", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: salvandoSenha ? "not-allowed" : "pointer", opacity: salvandoSenha ? 0.7 : 1, boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}>
                        {salvandoSenha ? "Salvando..." : "Salvar"}
                      </button>
                      <button type="button" onClick={() => { setMostrarModalSenha(false); setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha(""); setErroSenha(""); }}
                        style={{ padding: "10px 20px", background: "transparent", color: "#A7B0B8", border: "1.5px solid rgba(232, 237, 240, 0.2)", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sair */}
              <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "20px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                <button onClick={async () => { setLoggingOut(true); await signOut({ callbackUrl: "/login" }); }} disabled={loggingOut}
                  style={{ width: "100%", padding: "14px", background: "transparent", color: "#F87171", border: "1.5px solid rgba(239, 68, 68, 0.3)", borderRadius: "14px", fontSize: "15px", fontWeight: 600, cursor: loggingOut ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
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