"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { getPropostasComprador, confirmarNegociacao, cancelarProposta } from "@/app/actions/negociacao";
import CompradorSidebar from "@/app/components/layout/CompradorSidebar";

type PropostaDB = {
  id: number; solicitante: string; servico: string; status: string;
  documentoProposta: string | null; createdAt: string;
  vendedorConfirmou: boolean; compradorConfirmou: boolean;
  Listagem: { isoTipo: string; titulo: string } | null;
  Vendedor: { name: string } | null;
  _count: { mensagens: number };
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  CONTATO_SOLICITADO: { bg: "#FEF3C7", text: "#92400E", label: "Contato Solicitado" },
  EM_CONTATO:         { bg: "#DBEAFE", text: "#1E40AF", label: "Em Contato" },
  PROPOSTA_ENVIADA:   { bg: "#EDE9FE", text: "#6001D3", label: "Proposta Enviada" },
  EM_NEGOCIACAO:      { bg: "#FDE68A", text: "#92400E", label: "Em Negociação" },
  PROPOSTA_FECHADA:   { bg: "#DCFCE7", text: "#166534", label: "Proposta Fechada" },
  CANCELADA:          { bg: "#FEE2E2", text: "#991B1B", label: "Cancelada" },
};

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(80,0,160,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

export default function CompradorHome() {
  const router = useRouter();
  const [propostas, setPropostas] = useState<PropostaDB[]>([]);
  const [user, setUser] = useState<any>(null);
  const [detalhes, setDetalhes] = useState<PropostaDB | null>(null);
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const carregar = async () => {
    const [sessionData, propostasRes] = await Promise.all([getSession(), getPropostasComprador()]);
    setUser(sessionData);
    if (propostasRes.success && propostasRes.propostas) {
      const lista = propostasRes.propostas as any[];
      setPropostas(lista);
      if (lista.length === 0 && (sessionData as any)?.role === "COMPRADOR") {
        router.replace("/comprador/buscar");
      }
    }
  };

  useEffect(() => { carregar(); }, []);

  const handleConfirmar = async (id: number) => {
    setLoadingAcao(true);
    await confirmarNegociacao(id);
    setLoadingAcao(false);
    setDetalhes(null);
    carregar();
  };

  const handleCancelar = async (id: number) => {
    if (!confirm("Deseja cancelar esta proposta?")) return;
    setLoadingAcao(true);
    await cancelarProposta(id);
    setLoadingAcao(false);
    setDetalhes(null);
    carregar();
  };

  const pendentes = propostas.filter((p) => !["PROPOSTA_FECHADA", "CANCELADA"].includes(p.status)).length;
  const concluidas = propostas.filter((p) => p.status === "PROPOSTA_FECHADA").length;
  const propostasFiltradas = propostas.filter((p) => {
    const q = busca.toLowerCase();
    const textoOk = !busca || [p.Listagem?.titulo, p.servico, p.Listagem?.isoTipo, p.Vendedor?.name].join(" ").toLowerCase().includes(q);
    return textoOk && (filtroStatus === "TODOS" || p.status === filtroStatus);
  });

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>
          Olá, {user?.name?.split(" ")[0] || "Comprador"} 👋
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>
          Acompanhe suas propostas e negociações
        </p>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <CompradorSidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Total",         value: propostas.length, color: "#6001D3", bg: "#EDE9FE" },
              { label: "Em andamento",  value: pendentes,         color: "#F59E0B", bg: "#FFFBEB" },
              { label: "Concluídas",    value: concluidas,        color: "#059669", bg: "#ECFDF5" },
            ].map((c) => (
              <div key={c.label} style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 4px 16px rgba(80,0,160,0.08)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: c.color }}>{c.value}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{c.label}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111", margin: 0 }}>Minhas Propostas</h2>
              <button onClick={() => router.push("/comprador/buscar")}
                style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "10px", padding: "9px 20px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                + Buscar Serviço
              </button>
            </div>

            {propostas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
                <p style={{ color: "#374151", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>Nenhuma proposta ainda</p>
                <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 24px" }}>Busque serviços para iniciar uma negociação.</p>
                <button onClick={() => router.push("/comprador/buscar")}
                  style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "12px 28px", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Buscar Serviço
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  <input
                    type="text"
                    placeholder="Buscar por serviço, norma ou certificadora..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    style={{ padding: "10px 16px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box", color: "#111" }}
                  />
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[{ key: "TODOS", label: "Todos" }, ...Object.entries(statusConfig).map(([k, v]) => ({ key: k, label: v.label }))].map((s) => (
                      <button key={s.key} onClick={() => setFiltroStatus(s.key)}
                        style={{ padding: "5px 14px", borderRadius: "20px", border: "1.5px solid", borderColor: filtroStatus === s.key ? "#6001D3" : "#E5E7EB", background: filtroStatus === s.key ? "#6001D3" : "transparent", color: filtroStatus === s.key ? "#fff" : "#6B7280", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {propostasFiltradas.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: "14px", padding: "24px 0" }}>Nenhum resultado para esta busca.</p>
                ) : propostasFiltradas.map((p, i) => {
                  const sc = statusConfig[p.status] ?? { bg: "#FEF3C7", text: "#92400E", label: "Pendente" };
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 0", borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                      <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "20px" }}>📋</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.Listagem?.titulo || p.servico}
                        </div>
                        <div style={{ fontSize: "12px", color: "#7B00D4", fontWeight: 500 }}>
                          {p.Listagem?.isoTipo || ""}{p.Vendedor?.name ? ` · ${p.Vendedor.name}` : ""}
                        </div>
                      </div>
                      <span style={{ background: sc.bg, color: sc.text, fontSize: "12px", fontWeight: 700, padding: "5px 14px", borderRadius: "20px", flexShrink: 0 }}>
                        {sc.label}
                      </span>
                      <button onClick={() => setDetalhes(p)}
                        style={{ position: "relative", padding: "7px 16px", borderRadius: "8px", background: "#EDE9FE", color: "#6001D3", border: "1.5px solid #DDD6FE", fontWeight: 700, fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
                        Detalhes
                        {p._count.mensagens > 0 && (
                          <span style={{ position: "absolute", top: "-6px", right: "-6px", minWidth: "18px", height: "18px", borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", boxShadow: "0 2px 6px rgba(239,68,68,0.5)" }}>
                            {p._count.mensagens > 9 ? "9+" : p._count.mensagens}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {detalhes && (() => {
        const sc = statusConfig[detalhes.status] ?? { bg: "#FEF3C7", text: "#92400E", label: "Pendente" };
        const finalizado = ["PROPOSTA_FECHADA", "CANCELADA"].includes(detalhes.status);
        const podeConfirmar = !finalizado && !detalhes.compradorConfirmou &&
          ["PROPOSTA_ENVIADA", "EM_NEGOCIACAO"].includes(detalhes.status);
        const podeCancelar = !finalizado;
        return (
          <Modal onClose={() => setDetalhes(null)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#9CA3AF", fontWeight: 600 }}>PROPOSTA #{detalhes.id}</p>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#111" }}>
                  {detalhes.Listagem?.titulo || detalhes.servico}
                </h2>
              </div>
              <span style={{ background: sc.bg, color: sc.text, fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", flexShrink: 0, marginLeft: "12px" }}>
                {sc.label}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {detalhes.Listagem?.isoTipo && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#6B7280" }}>Norma</span>
                  <span style={{ fontWeight: 700, color: "#111" }}>{detalhes.Listagem.isoTipo}</span>
                </div>
              )}
              {detalhes.Vendedor?.name && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#6B7280" }}>Certificadora</span>
                  <span style={{ fontWeight: 700, color: "#111" }}>{detalhes.Vendedor.name}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#6B7280" }}>Data</span>
                <span style={{ fontWeight: 600, color: "#111" }}>
                  {new Date(detalhes.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {detalhes.vendedorConfirmou && (
                <div style={{ background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                  ✅ A certificadora já confirmou o encerramento
                </div>
              )}
            </div>

            {detalhes.documentoProposta && (
              <button onClick={() => window.open(detalhes.documentoProposta!, "_blank")}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", fontWeight: 700, color: "#6001D3", cursor: "pointer", width: "100%", marginBottom: "20px" }}>
                📄 Ver proposta enviada
              </button>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => { setDetalhes(null); router.push(`/chat/${detalhes.id}`); }}
                style={{ position: "relative", width: "100%", padding: "13px", borderRadius: "10px", background: "#EDE9FE", color: "#6001D3", border: "1.5px solid #DDD6FE", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                💬 Abrir Chat
                {detalhes._count.mensagens > 0 && (
                  <span style={{ marginLeft: "4px", minWidth: "20px", height: "20px", borderRadius: "10px", background: "#EF4444", color: "#fff", fontSize: "11px", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                    {detalhes._count.mensagens > 9 ? "9+" : detalhes._count.mensagens}
                  </span>
                )}
              </button>

              {podeConfirmar && (
                <button onClick={() => handleConfirmar(detalhes.id)} disabled={loadingAcao}
                  style={{ width: "100%", padding: "13px", borderRadius: "10px", background: "linear-gradient(90deg,#059669,#34D399)", color: "#fff", border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer", opacity: loadingAcao ? 0.7 : 1 }}>
                  ✅ Confirmar Negociação
                </button>
              )}

              {podeCancelar && (
                <button onClick={() => handleCancelar(detalhes.id)} disabled={loadingAcao}
                  style={{ width: "100%", padding: "13px", borderRadius: "10px", background: "transparent", color: "#EF4444", border: "1.5px solid #EF4444", fontWeight: 700, fontSize: "14px", cursor: "pointer", opacity: loadingAcao ? 0.7 : 1 }}>
                  ✕ Cancelar Proposta
                </button>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
