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
  BRONZE:  { icon: "🥉", label: "Bronze",  bg: "#FDF1E8", color: "#92400E", border: "#CD7F32" },
  PRATA:   { icon: "🥈", label: "Prata",   bg: "#F3F4F6", color: "#4B5563", border: "#9E9E9E" },
  OURO:    { icon: "🥇", label: "Ouro",    bg: "#FFFBEB", color: "#92400E", border: "#FFD700" },
  PLATINA: { icon: "💎", label: "Platina", bg: "#F5F3FF", color: "#6001D3", border: "#A855F7" },
};

function Campo({ label, value, onChange, placeholder, type = "text", readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B7280", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </label>
      <input
        type={type} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid", borderColor: readOnly ? "#F3F4F6" : "#E5E7EB", borderRadius: "10px", fontSize: "14px", color: readOnly ? "#9CA3AF" : "#111", background: readOnly ? "#FAFAFA" : "#fff", outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s" }}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = "#7B00D4"; }}
        onBlur={(e) => { if (!readOnly) e.target.style.borderColor = "#E5E7EB"; }}
      />
    </div>
  );
}

function certStatus(validadeIso: string | null): { label: string; color: string; bg: string } {
  if (!validadeIso) return { label: "Não informado", color: "#9CA3AF", bg: "#F3F4F6" };
  const dias = Math.ceil((new Date(validadeIso).getTime() - Date.now()) / 86400000);
  if (dias < 0) return { label: `Expirado há ${Math.abs(dias)} dia(s)`, color: "#B91C1C", bg: "#FEF2F2" };
  if (dias <= 30) return { label: `Expira em ${dias} dia(s)`, color: "#92400E", bg: "#FFFBEB" };
  return { label: `Válido — expira em ${dias} dia(s)`, color: "#065F46", bg: "#ECFDF5" };
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
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Meu Perfil</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>Gerencie as informações da sua certificadora</p>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <VendedorSidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ background: "#fff", borderRadius: "20px", padding: "60px", textAlign: "center", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
              <p style={{ color: "#9CA3AF" }}>Carregando...</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho com foto */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", display: "flex", alignItems: "center", gap: "20px" }}>
                <AvatarUpload nome={nome || "C"} imagemAtual={imagemUrl || null} tamanho={88} onUpload={(url) => setImagemUrl(url)} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111", margin: "0 0 4px" }}>{perfil?.name}</h2>
                  <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "0 0 10px" }}>{perfil?.login}</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: rank.bg, border: `1.5px solid ${rank.border}`, borderRadius: "20px", padding: "3px 10px" }}>
                      <span>{rank.icon}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: rank.color }}>{rank.label} · {Math.round(perfil?.rankScore ?? 0)} pts</span>
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: perfil?.statusVendedor === "APROVADO" ? "#DCFCE7" : "#FEF3C7", color: perfil?.statusVendedor === "APROVADO" ? "#166534" : "#92400E" }}>
                      {perfil?.statusVendedor === "APROVADO" ? "● Ativa" : perfil?.statusVendedor}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#9CA3AF" }}>Clique na foto para alterar</p>
                </div>
              </div>

              {/* Formulário */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Dados da Empresa</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <Campo label="Nome *" value={nome} onChange={setNome} placeholder="Nome de exibição" />
                  <Campo label="Razão Social" value={razaoSocial} onChange={setRazaoSocial} placeholder="Razão social completa" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <Campo label="CNPJ" value={cnpj} onChange={setCnpj} placeholder="00.000.000/0001-00" />
                  <Campo label="E-mail" value={email} onChange={setEmail} placeholder="contato@empresa.com.br" type="email" />
                </div>
                <Campo label="Login (não editável)" value={perfil?.login ?? ""} readOnly />

                {erro && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 14px", color: "#B91C1C", fontSize: "13px", marginTop: "16px" }}>{erro}</div>}
                {sucesso && <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "10px", padding: "10px 14px", color: "#065F46", fontSize: "13px", fontWeight: 600, marginTop: "16px" }}>✓ Perfil atualizado com sucesso!</div>}

                <button onClick={handleSalvar} disabled={salvando} style={{ marginTop: "20px", padding: "12px 32px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "14px", cursor: salvando ? "not-allowed" : "pointer", opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>

              {/* Certificado */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Certificado & ISOs Autorizadas</h3>
                <div style={{ background: cert.bg, borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: cert.color, textTransform: "uppercase", letterSpacing: "0.4px" }}>Validade do Certificado ISO</p>
                  <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: cert.color }}>
                    {perfil?.validadeCertificado ? new Date(perfil.validadeCertificado).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Não informado"}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: cert.color, opacity: 0.8 }}>{cert.label}</p>
                </div>
                {isos.length > 0 ? (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {isos.map((iso) => <span key={iso} style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "13px", fontWeight: 700, padding: "6px 14px", borderRadius: "10px" }}>{iso}</span>)}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>Nenhuma ISO autorizada. Entre em contato com o administrador.</p>
                )}
                <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#9CA3AF" }}>Para atualizar o certificado ou ISOs, contate o administrador.</p>
              </div>

              {/* Segurança */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Segurança</h3>
                {!mostrarModalSenha ? (
                  <button onClick={() => { setMostrarModalSenha(true); setErroSenha(""); setSucessoSenha(false); }}
                    style={{ padding: "10px 24px", background: "transparent", color: "#6001D3", border: "2px solid #EDE9FE", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F3FF"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    Trocar senha
                  </button>
                ) : (
                  <form onSubmit={handleTrocarSenha} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {erroSenha && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "10px 14px", color: "#B91C1C", fontSize: "13px" }}>{erroSenha}</div>}
                    {sucessoSenha && <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "10px", padding: "10px 14px", color: "#065F46", fontSize: "13px", fontWeight: 600 }}>✓ Senha alterada com sucesso!</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B7280", marginBottom: "6px", textTransform: "uppercase" }}>Senha atual</label>
                        <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required placeholder="••••••"
                          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B7280", marginBottom: "6px", textTransform: "uppercase" }}>Nova senha</label>
                        <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required placeholder="Mín. 6 caracteres"
                          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B7280", marginBottom: "6px", textTransform: "uppercase" }}>Confirmar</label>
                        <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required placeholder="Repita a senha"
                          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" disabled={salvandoSenha}
                        style={{ padding: "10px 24px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "14px", cursor: salvandoSenha ? "not-allowed" : "pointer", opacity: salvandoSenha ? 0.7 : 1 }}>
                        {salvandoSenha ? "Salvando..." : "Salvar"}
                      </button>
                      <button type="button" onClick={() => { setMostrarModalSenha(false); setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha(""); setErroSenha(""); }}
                        style={{ padding: "10px 20px", background: "transparent", color: "#6B7280", border: "1.5px solid #E5E7EB", borderRadius: "12px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Sair */}
              <div style={{ background: "#fff", borderRadius: "20px", padding: "20px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                <button onClick={async () => { setLoggingOut(true); await signOut({ callbackUrl: "/login" }); }} disabled={loggingOut}
                  style={{ width: "100%", padding: "14px", background: "transparent", color: "#EF4444", border: "2px solid #FEE2E2", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: loggingOut ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { if (!loggingOut) { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#FCA5A5"; } }}
                  onMouseLeave={(e) => { if (!loggingOut) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#FEE2E2"; } }}>
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