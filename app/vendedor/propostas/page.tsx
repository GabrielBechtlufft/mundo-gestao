"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";
import { getPropostasVendedor, confirmarVendedor, cancelarProposta } from "@/app/actions/negociacao";
import { getSession } from "@/app/actions/auth";

type PropostaVendedor = {
  id: number;
  solicitante: string;
  servico: string;
  status: string;
  vendedorConfirmou: boolean;
  compradorConfirmou: boolean;
  documentoCompra: string | null;
  createdAt: string;
  Comprador: { name: string; email: string } | null;
  Listagem: { isoTipo: string; titulo: string } | null;
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDENTE: { bg: "#FEF3C7", text: "#92400E", label: "Pendente" },
  VENDEDOR_CONFIRMOU: { bg: "#DBEAFE", text: "#1E40AF", label: "Você confirmou" },
  COMPRADOR_CONFIRMOU: { bg: "#FDE68A", text: "#92400E", label: "Comprador confirmou" },
  CONCLUIDA: { bg: "#DCFCE7", text: "#166534", label: "Concluída" },
  CANCELADA: { bg: "#FEE2E2", text: "#991B1B", label: "Cancelada" },
};

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 60px rgba(80,0,160,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

export default function VendedorPropostasPage() {
  const router = useRouter();
  const [propostas, setPropostas] = useState<PropostaVendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<number | null>(null);
  const [processando, setProcessando] = useState(false);

  const firstName = user?.name ? user.name.split(" ")[0] : "Certificadora";

  const carregar = async () => {
    const res = await getPropostasVendedor();
    if (res.success && res.propostas) setPropostas(res.propostas as any);
    setLoading(false);
  };

  useEffect(() => {
    getSession().then(setUser);
    carregar();
  }, []);

  const handleConfirmar = async (id: number) => {
    setProcessando(true);
    await confirmarVendedor(id);
    setProcessando(false);
    setConfirmModal(null);
    carregar();
  };

  const handleCancelar = async (id: number) => {
    if (!confirm("Deseja cancelar esta proposta?")) return;
    await cancelarProposta(id);
    carregar();
  };

  const pendentes = propostas.filter(p => !["CONCLUIDA", "CANCELADA"].includes(p.status));
  const concluidas = propostas.filter(p => p.status === "CONCLUIDA");

  return (
    <>
      <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
        <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, marginBottom: "32px", marginTop: "8px", letterSpacing: "-0.5px", flexShrink: 0 }}>
          Olá, {firstName}
        </h1>

        <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
          <VendedorSidebar />

          <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "36px 48px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", height: "100%", overflowY: "auto" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#111", margin: "0 0 8px" }}>Minhas Propostas</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 32px" }}>
              Propostas de compradores interessados nos seus serviços. A negociação é feita por fora da plataforma — aqui você confirma a conclusão.
            </p>

            {/* Summary cards */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
              {[
                { label: "Ativas", value: pendentes.length, color: "#F59E0B" },
                { label: "Concluídas", value: concluidas.length, color: "#22C55E" },
                { label: "Total", value: propostas.length, color: "#7B00D4" },
              ].map((c) => (
                <div key={c.label} style={{ borderLeft: `4px solid ${c.color}`, borderRadius: "12px", padding: "10px 18px", minWidth: "90px", boxShadow: "3px 5px 4px rgba(80,0,160,0.15)" }}>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: "11px", color: c.color, fontWeight: 600 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {loading ? (
              <p style={{ color: "#888", textAlign: "center", paddingTop: "40px" }}>Carregando...</p>
            ) : propostas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>📋</div>
                <p style={{ color: "#aaa", fontSize: "16px" }}>Nenhuma proposta recebida ainda.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {propostas.map((p) => {
                  const cfg = statusConfig[p.status] || statusConfig.PENDENTE;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", border: "1.5px solid #E5E7EB", borderRadius: "16px", transition: "box-shadow 0.2s" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#6001D3", fontSize: "13px" }}>
                            {p.Comprador?.name?.[0] || p.solicitante[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#111" }}>{p.Comprador?.name || p.solicitante}</div>
                            <div style={{ fontSize: "11px", color: "#888" }}>{p.Comprador?.email || ""}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: "12px", color: "#7B00D4", fontWeight: 600, marginBottom: "4px" }}>
                          {p.Listagem?.isoTipo || ""} — {p.Listagem?.titulo || p.servico}
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "11px", color: "#888" }}>
                          {p.vendedorConfirmou && <span style={{ color: "#22C55E" }}>✓ Você confirmou</span>}
                          {p.compradorConfirmou && <span style={{ color: "#22C55E" }}>✓ Comprador confirmou</span>}
                          {p.documentoCompra && (
                            <a href={p.documentoCompra} target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>
                              📄 Ver comprovante
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "16px" }}>
                        <span style={{ background: cfg.bg, color: cfg.text, fontSize: "12px", fontWeight: 700, padding: "6px 14px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                          {cfg.label}
                        </span>

                        <button
                          onClick={() => router.push(`/chat/${p.id}`)}
                          style={{ padding: "8px 14px", borderRadius: "8px", background: "#EDE9FE", color: "#6001D3", border: "1.5px solid #DDD6FE", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          💬 Chat
                        </button>

                        {!p.vendedorConfirmou && p.status !== "CANCELADA" && p.status !== "CONCLUIDA" && (
                          <button
                            onClick={() => setConfirmModal(p.id)}
                            style={{ padding: "8px 16px", borderRadius: "8px", background: "linear-gradient(90deg,#22C55E,#16A34A)", color: "#fff", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            ✓ Confirmar
                          </button>
                        )}
                        {p.status === "PENDENTE" && (
                          <button
                            onClick={() => handleCancelar(p.id)}
                            style={{ padding: "8px 14px", borderRadius: "8px", border: "1.5px solid #EF4444", color: "#EF4444", background: "transparent", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmModal && (
        <Overlay onClose={() => setConfirmModal(null)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🤝</div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111", marginTop: 0, marginBottom: "12px" }}>Confirmar Conclusão</h2>
            <p style={{ color: "#666", marginBottom: "28px", lineHeight: 1.6 }}>
              Ao confirmar, você indica que a negociação foi realizada com sucesso do seu lado. 
              A proposta só será marcada como <strong>concluída</strong> quando o comprador também confirmar e enviar o comprovante.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: "14px", background: "transparent", border: "1.5px solid #ccc", borderRadius: "12px", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => handleConfirmar(confirmModal)} disabled={processando} style={{ flex: 1, padding: "14px", background: "linear-gradient(90deg,#22C55E,#16A34A)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>
                {processando ? "Confirmando..." : "✓ Confirmar"}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}
