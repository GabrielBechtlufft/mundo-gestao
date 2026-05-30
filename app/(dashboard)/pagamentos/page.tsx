"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import { getSession } from "@/app/actions/auth";
import { getTodasPropostas } from "@/app/actions/negociacao";

type PropostaAdmin = { id: number; solicitante: string; servico: string; status: string; documentoCompra: string | null; Comprador: { name: string; email: string } | null; Vendedor: { name: string } | null; Listagem: { isoTipo: string; titulo: string } | null; };

export default function PagamentosPage() {
  const [propostas, setPropostas] = useState<PropostaAdmin[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(setUser);
    getTodasPropostas().then((res) => {
      if (res.success && res.propostas) setPropostas((res.propostas as any).filter((p: any) => p.status === "CONCLUIDA"));
      setLoading(false);
    });
  }, []);

  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";

  return (
    <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <h1 style={{ color: "#fff", fontSize: "42px", fontWeight: 700, marginBottom: "28px", marginTop: "8px", flexShrink: 0 }}>Olá, {firstName}</h1>
      <div style={{ display: "flex", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", height: "100%", overflowY: "auto" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#111", marginBottom: "20px", marginTop: 0 }}>Pagamentos</h2>
          <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
            <div style={{ borderLeft: "4px solid #16A34A", borderRadius: "12px", padding: "10px 18px", minWidth: "100px", boxShadow: "3px 5px 4px rgba(80,0,160,0.2)" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#16A34A" }}>{propostas.length}</div>
              <div style={{ fontSize: "10px", color: "#16A34A", fontWeight: 500 }}>Negociações Concluídas</div>
            </div>
          </div>
          {loading ? <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>Carregando...</p> : propostas.length === 0 ? <p style={{ color: "#aaa", textAlign: "center", padding: "40px" }}>Nenhum pagamento concluído.</p> : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {propostas.map((item, index) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderTop: index > 0 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#DCFCE7", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#16A34A", fontSize: "13px" }}>✓</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{item.Comprador?.name || item.solicitante} → {item.Vendedor?.name || "—"}</div>
                    <div style={{ fontSize: "12px", color: "#7B00D4", marginTop: "2px" }}>{item.Listagem?.isoTipo || ""} — {item.Listagem?.titulo || item.servico}</div>
                  </div>
                  {item.documentoCompra && (
                    <a href={item.documentoCompra} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>📄 Comprovante</a>
                  )}
                  <button style={{ background: "#16A34A", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 18px", fontSize: "12px", fontWeight: 600, cursor: "default" }}>Concluído</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
