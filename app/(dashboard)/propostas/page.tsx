"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/layout/Sidebar";
import { getTodasPropostas } from "@/app/actions/negociacao";

type PropostaAdmin = {
  id: number; solicitante: string; servico: string; status: string;
  vendedorConfirmou: boolean; compradorConfirmou: boolean;
  documentoCompra: string | null; createdAt: string; updatedAt: string;
  primeiraRespostaVendedorAt: string | null;
  Comprador: { name: string; email: string; image: string | null } | null;
  Vendedor: { name: string; email: string | null; image: string | null; razaoSocial: string | null } | null;
  Listagem: { isoTipo: string; titulo: string } | null;
};

const STATUS_CFG: Record<string, { bg: string; text: string; label: string; cor: string }> = {
  PENDENTE:            { bg: "#FEF3C7", text: "#92400E", label: "Pendente",               cor: "#F59E0B" },
  VENDEDOR_CONFIRMOU:  { bg: "#DBEAFE", text: "#1E40AF", label: "Certificadora confirmou", cor: "#3B82F6" },
  COMPRADOR_CONFIRMOU: { bg: "#FDE68A", text: "#92400E", label: "Comprador confirmou",     cor: "#F59E0B" },
  CONCLUIDA:           { bg: "#DCFCE7", text: "#166534", label: "Concluída",               cor: "#16A34A" },
  CANCELADA:           { bg: "#FEE2E2", text: "#991B1B", label: "Cancelada",               cor: "#EF4444" },
};

// As etapas em ordem cronológica
const ETAPAS = [
  { key: "CRIADA",             label: "Proposta criada",           desc: "Comprador enviou a solicitação de orçamento." },
  { key: "VENDEDOR_CONFIRMOU", label: "Certificadora confirmou",   desc: "A certificadora aceitou e confirmou interesse." },
  { key: "COMPRADOR_CONFIRMOU",label: "Comprador confirmou",       desc: "O comprador enviou o comprovante de pagamento." },
  { key: "CONCLUIDA",          label: "Negociação concluída",      desc: "Ambas as partes concluíram a negociação." },
];

function etapasPassadas(proposta: PropostaAdmin) {
  const { status, vendedorConfirmou, compradorConfirmou } = proposta;
  if (status === "CANCELADA") return -1; // especial
  if (status === "CONCLUIDA") return 3;
  if (compradorConfirmou) return 2;
  if (vendedorConfirmou) return 1;
  return 0;
}

function dataFormatada(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Avatar({ nome, imagem, size = 40 }: { nome: string; imagem?: string | null; size?: number }) {
  if (imagem) return <img src={imagem} alt={nome} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  const cor = ["#6001D3", "#0891B2", "#059669", "#D97706"][nome.charCodeAt(0) % 4];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: cor + "20", border: `2px solid ${cor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: size * 0.38, fontWeight: 800, color: cor }}>
      {nome[0]?.toUpperCase()}
    </div>
  );
}

function ModalHistorico({ proposta, onClose }: { proposta: PropostaAdmin; onClose: () => void }) {
  const cancelada = proposta.status === "CANCELADA";
  const etapaAtual = etapasPassadas(proposta);

  const timestampEtapa = (idx: number): string | null => {
    if (idx === 0) return proposta.createdAt;
    if (idx === 1) return proposta.primeiraRespostaVendedorAt ?? null;
    if (idx === 2) return null; // não temos timestamp para quando comprador confirmou
    if (idx === 3) return proposta.updatedAt;
    return null;
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)", padding: "24px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "24px", padding: "36px 32px", width: "100%", maxWidth: "540px", boxShadow: "0 24px 80px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#9CA3AF", fontWeight: 600 }}>Proposta #{proposta.id}</p>
            <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 800, color: "#111" }}>
              {proposta.Listagem?.isoTipo ?? "—"}
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#6B7280" }}>{proposta.Listagem?.titulo || proposta.servico}</p>
          </div>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", cursor: "pointer", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: "16px", flexShrink: 0 }}>✕</button>
        </div>

        {/* Participantes */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Comprador", nome: proposta.Comprador?.name || proposta.solicitante, email: proposta.Comprador?.email, imagem: proposta.Comprador?.image },
            { label: "Certificadora", nome: proposta.Vendedor?.razaoSocial || proposta.Vendedor?.name || "—", email: proposta.Vendedor?.email, imagem: proposta.Vendedor?.image },
          ].map((p) => (
            <div key={p.label} style={{ flex: 1, background: "#F9FAFB", borderRadius: "14px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Avatar nome={p.nome} imagem={p.imagem} size={36} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 1px", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px" }}>{p.label}</p>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</p>
                {p.email && <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Histórico de etapas</p>

          {cancelada ? (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#FEF2F2", border: "2px solid #EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>❌</div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#B91C1C" }}>Negociação cancelada</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF" }}>Atualizada em {dataFormatada(proposta.updatedAt)}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {ETAPAS.map((etapa, idx) => {
                const concluida = idx <= etapaAtual;
                const atual = idx === etapaAtual;
                const ts = timestampEtapa(idx);

                return (
                  <div key={etapa.key} style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
                    {/* Linha vertical + círculo */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "32px", flexShrink: 0 }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: concluida ? (atual && etapaAtual < 3 ? "#EDE9FE" : "#DCFCE7") : "#F3F4F6", border: `2px solid ${concluida ? (atual && etapaAtual < 3 ? "#7B00D4" : "#16A34A") : "#E5E7EB"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0, zIndex: 1 }}>
                        {concluida ? (atual && etapaAtual < 3 ? "⏳" : "✅") : "○"}
                      </div>
                      {idx < ETAPAS.length - 1 && (
                        <div style={{ width: "2px", flex: 1, background: idx < etapaAtual ? "#16A34A" : "#E5E7EB", minHeight: "20px" }} />
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div style={{ flex: 1, paddingLeft: "12px", paddingBottom: idx < ETAPAS.length - 1 ? "20px" : "0" }}>
                      <p style={{ margin: "3px 0 2px", fontSize: "14px", fontWeight: concluida ? 700 : 500, color: concluida ? "#111" : "#9CA3AF" }}>{etapa.label}</p>
                      <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#9CA3AF" }}>{etapa.desc}</p>
                      {ts && <p style={{ margin: 0, fontSize: "11px", color: "#6001D3", fontWeight: 600 }}>{dataFormatada(ts)}</p>}
                      {!ts && concluida && idx > 0 && <p style={{ margin: 0, fontSize: "11px", color: "#D1D5DB" }}>Data não registrada</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comprovante */}
        {proposta.documentoCompra && (
          <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>📄</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: 700, color: "#0284C7" }}>Comprovante de pagamento</p>
              <a href={proposta.documentoCompra} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#0369A1" }}>Visualizar documento ↗</a>
            </div>
          </div>
        )}

        {/* Status atual */}
        <div style={{ background: STATUS_CFG[proposta.status]?.bg ?? "#F3F4F6", borderRadius: "12px", padding: "12px 16px", textAlign: "center" }}>
          <p style={{ margin: "0 0 2px", fontSize: "11px", color: STATUS_CFG[proposta.status]?.text ?? "#374151", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status atual</p>
          <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: STATUS_CFG[proposta.status]?.text ?? "#374151" }}>
            {STATUS_CFG[proposta.status]?.label ?? proposta.status}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PropostasPage() {
  const router = useRouter();
  const [propostas, setPropostas] = useState<PropostaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalProposta, setModalProposta] = useState<PropostaAdmin | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "ativas" | "concluidas" | "canceladas">("todas");

  useEffect(() => {
    getTodasPropostas().then((res) => {
      if (res.success && res.propostas) setPropostas(res.propostas as any);
      setLoading(false);
    });
  }, []);

  const lista = propostas.filter((p) => {
    if (filtro === "ativas") return !["CONCLUIDA", "CANCELADA"].includes(p.status);
    if (filtro === "concluidas") return p.status === "CONCLUIDA";
    if (filtro === "canceladas") return p.status === "CANCELADA";
    return true;
  });

  const ativas = propostas.filter(p => !["CONCLUIDA", "CANCELADA"].includes(p.status)).length;
  const concluidas = propostas.filter(p => p.status === "CONCLUIDA").length;
  const canceladas = propostas.filter(p => p.status === "CANCELADA").length;

  return (
    <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <h1 style={{ color: "#fff", fontSize: "42px", fontWeight: 700, marginBottom: "28px", marginTop: "8px", letterSpacing: "-0.5px", flexShrink: 0 }}>
        Propostas
      </h1>

      <div style={{ display: "flex", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <Sidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>

          {/* Cards de resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            {[
              { label: "Total", value: propostas.length, color: "#6001D3", bg: "#EDE9FE", key: "todas" },
              { label: "Em andamento", value: ativas, color: "#F59E0B", bg: "#FFFBEB", key: "ativas" },
              { label: "Concluídas", value: concluidas, color: "#059669", bg: "#ECFDF5", key: "concluidas" },
              { label: "Canceladas", value: canceladas, color: "#EF4444", bg: "#FEF2F2", key: "canceladas" },
            ].map((c) => (
              <button key={c.key} onClick={() => setFiltro(c.key as any)}
                style={{ background: "#fff", borderRadius: "16px", padding: "16px 20px", boxShadow: filtro === c.key ? `0 0 0 2px ${c.color}` : "0 4px 16px rgba(80,0,160,0.08)", display: "flex", alignItems: "center", gap: "12px", border: "none", cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "20px", fontWeight: 900, color: c.color }}>{c.value}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: filtro === c.key ? c.color : "#374151" }}>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Lista de cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {loading ? (
              <div style={{ background: "#fff", borderRadius: "20px", padding: "60px", textAlign: "center", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                <p style={{ color: "#9CA3AF" }}>Carregando propostas...</p>
              </div>
            ) : lista.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: "20px", padding: "60px", textAlign: "center", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
                <p style={{ color: "#374151", fontSize: "16px", fontWeight: 700, margin: "0 0 6px" }}>Nenhuma proposta</p>
                <p style={{ color: "#9CA3AF", fontSize: "13px" }}>Nenhum resultado para o filtro selecionado.</p>
              </div>
            ) : lista.map((p) => {
              const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.PENDENTE;
              const compradorNome = p.Comprador?.name || p.solicitante;
              const vendedorNome = p.Vendedor?.razaoSocial || p.Vendedor?.name || "—";
              const etapa = etapasPassadas(p);

              return (
                <div key={p.id} style={{ background: "#fff", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 4px 20px rgba(80,0,160,0.08)", border: "1.5px solid #F3F4F6" }}>

                  {/* Linha 1: ISO + título + status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>
                          {p.Listagem?.isoTipo || "—"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#9CA3AF" }}>#{p.id}</span>
                        <span style={{ fontSize: "11px", color: "#9CA3AF" }}>· {new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111" }}>
                        {p.Listagem?.titulo || p.servico}
                      </h3>
                    </div>
                    <span style={{ background: cfg.bg, color: cfg.text, fontSize: "12px", fontWeight: 700, padding: "5px 14px", borderRadius: "20px", flexShrink: 0 }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Linha 2: Participantes lado a lado */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    {/* Comprador */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", background: "#F9FAFB", borderRadius: "12px", padding: "10px 14px" }}>
                      <Avatar nome={compradorNome} imagem={p.Comprador?.image} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: "0 0 1px", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px" }}>Comprador</p>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{compradorNome}</p>
                        {p.Comprador?.email && <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.Comprador.email}</p>}
                      </div>
                    </div>

                    {/* Seta */}
                    <div style={{ flexShrink: 0, color: "#D1D5DB", fontSize: "20px" }}>→</div>

                    {/* Certificadora */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", background: "#F9FAFB", borderRadius: "12px", padding: "10px 14px" }}>
                      <Avatar nome={vendedorNome} imagem={p.Vendedor?.image} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: "0 0 1px", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px" }}>Certificadora</p>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vendedorNome}</p>
                        {p.Vendedor?.email && <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.Vendedor.email}</p>}
                      </div>
                    </div>

                  </div>

                  {/* Linha 3: Mini-progresso + botões */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                    {/* Mini linha de progresso */}
                    {p.status !== "CANCELADA" ? (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                        {ETAPAS.map((etapaItem, idx) => {
                          const feita = idx <= etapa;
                          const atual = idx === etapa && etapa < 3;
                          return (
                            <div key={etapaItem.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <div title={etapaItem.label} style={{ width: "22px", height: "22px", borderRadius: "50%", background: feita ? (atual ? "#EDE9FE" : "#DCFCE7") : "#F3F4F6", border: `2px solid ${feita ? (atual ? "#7B00D4" : "#16A34A") : "#E5E7EB"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                                {feita ? (atual ? "⏳" : "✓") : "○"}
                              </div>
                              {idx < ETAPAS.length - 1 && (
                                <div style={{ height: "2px", width: "24px", background: idx < etapa ? "#16A34A" : "#E5E7EB", borderRadius: "1px" }} />
                              )}
                            </div>
                          );
                        })}
                        <span style={{ fontSize: "11px", color: "#6B7280", marginLeft: "6px" }}>
                          {ETAPAS[Math.min(etapa, ETAPAS.length - 1)]?.label}
                        </span>
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "11px", color: "#EF4444", fontWeight: 600 }}>❌ Negociação cancelada</span>
                      </div>
                    )}

                    {/* Botões */}
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button
                        onClick={() => setModalProposta(p)}
                        style={{ padding: "7px 16px", borderRadius: "10px", border: "1.5px solid #E5E7EB", background: "#F9FAFB", color: "#374151", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6001D3"; e.currentTarget.style.color = "#6001D3"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#374151"; }}
                      >
                        📋 Ver histórico
                      </button>
                      <button
                        onClick={() => router.push(`/chat/${p.id}`)}
                        style={{ padding: "7px 16px", borderRadius: "10px", border: "1.5px solid #EDE9FE", background: "#EDE9FE", color: "#6001D3", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Histórico */}
      {modalProposta && (
        <ModalHistorico proposta={modalProposta} onClose={() => setModalProposta(null)} />
      )}
    </div>
  );
}