"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import { getVendedoresAtivos, suspenderVendedor, reativarVendedor, cadastrarVendedorDireto } from "@/app/actions/admin";

type Certificadora = {
  id: string; name: string; email: string | null; statusVendedor: string;
  razaoSocial: string | null; cnpj: string | null; isosVendidas: string;
  validadeCertificado: string | null;
  _count: { listagens: number };
};

function certBadge(validade: string | null): { label: string; color: string; bg: string } {
  if (!validade) return { label: "Sem certificado", color: "#9CA3AF", bg: "#F3F4F6" };
  const dias = Math.ceil((new Date(validade).getTime() - Date.now()) / 86400000);
  if (dias < 0)   return { label: `Exp. há ${Math.abs(dias)}d`, color: "#B91C1C", bg: "#FEF2F2" };
  if (dias <= 30) return { label: `Expira em ${dias}d`, color: "#92400E", bg: "#FFFBEB" };
  return { label: `Válido — ${dias}d`, color: "#065F46", bg: "#ECFDF5" };
}

export default function VendedoresPage() {
  const [certificadoras, setCertificadoras] = useState<Certificadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detalhe, setDetalhe] = useState<Certificadora | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", login: "" });
  const [formError, setFormError] = useState("");

  const carregar = async () => {
    const res = await getVendedoresAtivos();
    if (res.success) setCertificadoras(res.vendedores as any);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleSuspender = async (id: string) => {
    if (!confirm("Deseja suspender esta certificadora? Todas as listagens serão pausadas.")) return;
    await suspenderVendedor(id);
    carregar();
  };

  const handleReativar = async (id: string) => {
    await reativarVendedor(id);
    carregar();
  };

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await cadastrarVendedorDireto(formData);
    if (res.success) {
      setShowModal(false);
      setFormData({ name: "", email: "", login: "" });
      carregar();
    } else {
      setFormError(res.error || "Erro ao cadastrar.");
    }
  };

  const statusColor: Record<string, string> = { APROVADO: "#22C55E", SUSPENSO: "#EF4444", PENDENTE: "#F59E0B" };
  const statusLabel: Record<string, string> = { APROVADO: "Aprovada", SUSPENSO: "Suspensa", PENDENTE: "Pendente" };

  const certExpiradas = certificadoras.filter((c) => {
    if (!c.validadeCertificado) return false;
    return new Date(c.validadeCertificado) < new Date();
  });

  return (
    <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <h1 style={{ color: "#fff", fontSize: "42px", fontWeight: 700, marginBottom: "28px", marginTop: "8px", letterSpacing: "-0.5px", flexShrink: 0 }}>
        Certificadoras
      </h1>

      <div style={{ display: "flex", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", height: "100%", overflowY: "auto" }}>

          {/* Alerta de certificados expirados */}
          {certExpiradas.length > 0 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>⚠️</span>
              <p style={{ margin: 0, fontSize: "13px", color: "#B91C1C", fontWeight: 600 }}>
                {certExpiradas.length} certificadora{certExpiradas.length > 1 ? "s" : ""} com certificado ISO expirado:{" "}
                {certExpiradas.map((c) => c.name).join(", ")}
              </p>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111", margin: 0 }}>Certificadoras Cadastradas</h2>
              <span style={{ fontSize: "14px", color: "#888" }}>{certificadoras.length} no total</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ background: "#6001D3", color: "#fff", border: "none", borderRadius: "12px", padding: "10px 20px", fontWeight: 700, cursor: "pointer", transition: "transform 0.1s" }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              + Nova Certificadora
            </button>
          </div>

          {loading ? (
            <p style={{ color: "#888", textAlign: "center", paddingTop: "40px" }}>Carregando...</p>
          ) : certificadoras.length === 0 ? (
            <p style={{ color: "#aaa", textAlign: "center", paddingTop: "40px" }}>Nenhuma certificadora cadastrada.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {certificadoras.map((v, i) => {
                const cert = certBadge(v.validadeCertificado);
                const isos = v.isosVendidas ? v.isosVendidas.split(",").map((s) => s.trim()).filter(Boolean) : [];
                return (
                  <div key={v.id} style={{ padding: "16px 0", borderTop: i > 0 ? "1px solid #f0f0f0" : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#EDE9FE", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#6001D3", fontSize: "16px" }}>
                        {v.name[0]}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: "15px", color: "#111", margin: "0 0 2px" }}>
                          {v.razaoSocial || v.name}
                        </p>
                        <p style={{ fontSize: "12px", color: "#888", margin: "0 0 6px" }}>
                          {v.email || "Sem e-mail"}
                          {v.cnpj && ` · CNPJ: ${v.cnpj}`}
                          {` · ${v._count.listagens} listagem(s)`}
                        </p>

                        {/* Certificado */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: cert.bg, color: cert.color }}>
                            📜 {cert.label}
                            {v.validadeCertificado && (
                              <span style={{ fontWeight: 400, marginLeft: "4px" }}>
                                ({new Date(v.validadeCertificado).toLocaleDateString("pt-BR")})
                              </span>
                            )}
                          </span>

                          {isos.map((iso) => (
                            <span key={iso} style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "8px" }}>
                              {iso}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <span style={{ background: (statusColor[v.statusVendedor] || "#ccc") + "22", color: statusColor[v.statusVendedor] || "#ccc", fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px" }}>
                          {statusLabel[v.statusVendedor] || v.statusVendedor}
                        </span>
                        <button
                          onClick={() => setDetalhe(v)}
                          style={{ padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #E5E7EB", color: "#374151", fontWeight: 600, fontSize: "12px", background: "transparent", cursor: "pointer" }}
                        >
                          Detalhes
                        </button>
                        {v.statusVendedor === "APROVADO" ? (
                          <button onClick={() => handleSuspender(v.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1.5px solid #EF4444", color: "#EF4444", fontWeight: 600, fontSize: "13px", background: "transparent", cursor: "pointer" }}>
                            Suspender
                          </button>
                        ) : v.statusVendedor === "SUSPENSO" ? (
                          <button onClick={() => handleReativar(v.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1.5px solid #22C55E", color: "#22C55E", fontWeight: 600, fontSize: "13px", background: "transparent", cursor: "pointer" }}>
                            Reativar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {detalhe && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setDetalhe(null)}>
          <div style={{ background: "#fff", borderRadius: "24px", padding: "36px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, color: "#6001D3" }}>
                {detalhe.name[0]}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#111" }}>{detalhe.razaoSocial || detalhe.name}</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#9CA3AF" }}>{detalhe.email}</p>
              </div>
            </div>

            {[
              { label: "CNPJ", value: detalhe.cnpj || "—" },
              { label: "Login", value: detalhe.name },
              { label: "Listagens", value: `${detalhe._count.listagens}` },
              { label: "Status", value: statusLabel[detalhe.statusVendedor] || detalhe.statusVendedor },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: "13px", color: "#6B7280", fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: "13px", color: "#111", fontWeight: 700 }}>{value}</span>
              </div>
            ))}

            {/* Certificado */}
            <div style={{ marginTop: "16px", marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.4px", margin: "0 0 8px" }}>Certificado ISO</p>
              {(() => {
                const c = certBadge(detalhe.validadeCertificado);
                return (
                  <div style={{ background: c.bg, borderRadius: "10px", padding: "10px 14px" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: c.color }}>
                      {detalhe.validadeCertificado
                        ? new Date(detalhe.validadeCertificado).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
                        : "Não informado"}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: c.color, opacity: 0.8 }}>{c.label}</p>
                  </div>
                );
              })()}
            </div>

            {detalhe.isosVendidas && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.4px", margin: "0 0 8px" }}>ISOs autorizadas</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {detalhe.isosVendidas.split(",").map((iso) => (
                    <span key={iso} style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "10px" }}>{iso.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setDetalhe(null)} style={{ width: "100%", padding: "12px", background: "#F3F4F6", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", color: "#374151" }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", borderRadius: "24px", padding: "40px", width: "100%", maxWidth: "450px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111", marginBottom: "8px" }}>Cadastrar Certificadora</h2>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>Insira os dados da nova certificadora. A senha provisória será <strong>senha@123</strong> e deverá ser alterada no primeiro acesso.</p>

            <form onSubmit={handleCadastrar} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {formError && <div style={{ color: "#EF4444", fontSize: "13px", fontWeight: 700, textAlign: "center", background: "#FEF2F2", padding: "10px", borderRadius: "10px" }}>{formError}</div>}

              {[
                { label: "Nome:", field: "name" as const, type: "text" },
                { label: "E-mail:", field: "email" as const, type: "email" },
                { label: "Login:", field: "login" as const, type: "text" },
              ].map(({ label, field, type }) => (
                <div key={field} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#6001D3", marginLeft: "4px" }}>{label}</label>
                  <input
                    required type={type} value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    style={{ width: "100%", height: "46px", borderRadius: "12px", border: "1px solid #E5E7EB", padding: "0 16px", outline: "none" }}
                  />
                </div>
              ))}

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, height: "50px", borderRadius: "14px", border: "1px solid #E5E7EB", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, height: "50px", borderRadius: "14px", border: "none", background: "#6001D3", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Salvar Certificadora</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}