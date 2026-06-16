"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import { getSession } from "@/app/actions/auth";
import { getTodasPropostas, fecharProposta } from "@/app/actions/negociacao";

type PropostaAdmin = {
  id: number; solicitante: string; servico: string; status: string;
  documentoCompra: string | null; documentoProposta: string | null;
  Comprador: { name: string; email: string } | null;
  Vendedor: { name: string } | null;
  Listagem: { isoTipo: string; titulo: string } | null;
};

export default function PagamentosPage() {
  const [propostas, setPropostas] = useState<PropostaAdmin[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [arquivando, setArquivando] = useState<number | null>(null);

  const carregar = async () => {
    getTodasPropostas().then((res) => {
      if (res.success && res.propostas) {
        setPropostas((res.propostas as any).filter((p: any) =>
          ["EM_NEGOCIACAO", "PROPOSTA_FECHADA"].includes(p.status)
        ));
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    getSession().then(setUser);
    carregar();
  }, []);

  const handleArquivar = async (id: number) => {
    setArquivando(id);
    await fecharProposta(id);
    await carregar();
    setArquivando(null);
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";

  const aguardando = propostas.filter(p => p.status === "EM_NEGOCIACAO");
  const fechadas = propostas.filter(p => p.status === "PROPOSTA_FECHADA");

  return (
    <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <h1 style={{ color: "#fff", fontSize: "42px", fontWeight: 700, marginBottom: "28px", marginTop: "8px", flexShrink: 0 }}>Olá, {firstName}</h1>
      <div style={{ display: "flex", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", height: "100%", overflowY: "auto" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#111", marginBottom: "20px", marginTop: 0 }}>Pagamentos</h2>

          {/* Métricas */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
            <div style={{ borderLeft: "4px solid #F59E0B", borderRadius: "12px", padding: "10px 18px", minWidth: "120px", boxShadow: "3px 5px 4px rgba(80,0,160,0.15)" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#F59E0B" }}>{aguardando.length}</div>
              <div style={{ fontSize: "10px", color: "#F59E0B", fontWeight: 500 }}>Aguardando Arquivamento</div>
            </div>
            <div style={{ borderLeft: "4px solid #16A34A", borderRadius: "12px", padding: "10px 18px", minWidth: "120px", boxShadow: "3px 5px 4px rgba(80,0,160,0.15)" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#16A34A" }}>{fechadas.length}</div>
              <div style={{ fontSize: "10px", color: "#16A34A", fontWeight: 500 }}>Propostas Fechadas</div>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>Carregando...</p>
          ) : (
            <>
              {/* Aguardando arquivamento */}
              {aguardando.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#92400E", background: "#FEF3C7", padding: "8px 14px", borderRadius: "8px", marginBottom: "16px", display: "inline-block" }}>
                    ⏳ Aguardando Arquivamento
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    {aguardando.map((item, index) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderTop: index > 0 ? "1px solid #f0f0f0" : "none" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#FEF3C7", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#F59E0B", fontSize: "16px" }}>⏳</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{item.Comprador?.name || item.solicitante} → {item.Vendedor?.name || "—"}</div>
                          <div style={{ fontSize: "12px", color: "#7B00D4", marginTop: "2px" }}>{item.Listagem?.isoTipo || ""} — {item.Listagem?.titulo || item.servico}</div>
                        </div>
                        {item.documentoProposta && (
                          <a href={item.documentoProposta} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#6001D3", fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>📄 Proposta</a>
                        )}
                        <button
                          onClick={() => handleArquivar(item.id)}
                          disabled={arquivando === item.id}
                          style={{ background: arquivando === item.id ? "#D1FAE5" : "#16A34A", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "12px", fontWeight: 700, cursor: arquivando === item.id ? "not-allowed" : "pointer", flexShrink: 0, transition: "all 0.2s" }}
                        >
                          {arquivando === item.id ? "Arquivando..." : "✓ Arquivar Pagamento"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Propostas fechadas */}
              {fechadas.length === 0 && aguardando.length === 0 ? (
                <p style={{ color: "#aaa", textAlign: "center", padding: "40px" }}>Nenhuma proposta em negociação ainda.</p>
              ) : fechadas.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "8px 14px", borderRadius: "8px", marginBottom: "16px", display: "inline-block" }}>
                    ✓ Propostas Fechadas
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {fechadas.map((item, index) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderTop: index > 0 ? "1px solid #f0f0f0" : "none" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#DCFCE7", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#16A34A", fontSize: "13px" }}>✓</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{item.Comprador?.name || item.solicitante} → {item.Vendedor?.name || "—"}</div>
                          <div style={{ fontSize: "12px", color: "#7B00D4", marginTop: "2px" }}>{item.Listagem?.isoTipo || ""} — {item.Listagem?.titulo || item.servico}</div>
                        </div>
                        {item.documentoProposta && (
                          <a href={item.documentoProposta} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#6001D3", fontWeight: 600, textDecoration: "none" }}>📄 Proposta</a>
                        )}
                        {item.documentoCompra && (
                          <a href={item.documentoCompra} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>📄 Pagamento</a>
                        )}
                        <span style={{ background: "#16A34A", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 18px", fontSize: "12px", fontWeight: 600 }}>Fechada</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
