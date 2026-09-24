"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import { excluirCliente, getClientes, reativarCliente, suspenderCliente } from "@/app/actions/admin";

type Cliente = { id: string; name: string; email: string | null; login: string; statusVendedor: string };

const actionButton = (color: string): React.CSSProperties => ({
  padding: "7px 14px", borderRadius: "8px", border: `1.5px solid ${color}`,
  color, fontWeight: 600, fontSize: "12px", background: "transparent", cursor: "pointer",
});

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    const res = await getClientes();
    if (res.success) setClientes(res.clientes);
    setLoading(false);
  };

  useEffect(() => { void carregar(); }, []);

  const filtrados = clientes.filter((c) => `${c.name} ${c.email || ""} ${c.login}`.toLowerCase().includes(busca.toLowerCase()));
  const suspensos = clientes.filter((c) => c.statusVendedor === "SUSPENSO").length;

  return (
    <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ margin: "8px 0 28px" }}>
        <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Clientes</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>Visualize e gerencie os clientes cadastrados na plataforma.</p>
      </div>

      <div style={{ display: "flex", gap: "24px", minHeight: 0, flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, overflow: "auto", background: "#fff", borderRadius: "20px", padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", marginBottom: "22px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ minWidth: "130px", borderRadius: "12px", background: "#F5F3FF", padding: "10px 14px" }}>
                <div style={{ color: "#7C3AED", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Total</div>
                <div style={{ color: "#3B0764", fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{clientes.length}</div>
              </div>
              <div style={{ minWidth: "130px", borderRadius: "12px", background: "#FFFBEB", padding: "10px 14px" }}>
                <div style={{ color: "#B45309", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>Suspensos</div>
                <div style={{ color: "#92400E", fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{suspensos}</div>
              </div>
            </div>
            <div style={{ width: "min(100%, 360px)", position: "relative" }}>
              <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>⌕</span>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou login" style={{ width: "100%", height: "42px", boxSizing: "border-box", padding: "0 14px 0 36px", borderRadius: "10px", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none", fontSize: "13px" }} />
            </div>
          </div>

          <div style={{ borderTop: "1px solid #F0F0F0" }}>
            {loading ? <p style={{ color: "#9CA3AF", textAlign: "center", padding: "42px 0", margin: 0 }}>Carregando clientes...</p> : filtrados.length === 0 ? <div style={{ textAlign: "center", padding: "52px 16px", color: "#9CA3AF" }}><div style={{ fontSize: "30px", marginBottom: "10px" }}>👥</div><strong style={{ color: "#6B7280" }}>{busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</strong><p style={{ fontSize: "13px", margin: "6px 0 0" }}>{busca ? "Tente ajustar os termos da busca." : "Os novos clientes aparecerão aqui."}</p></div> : filtrados.map((c, index) => {
              const suspenso = c.statusVendedor === "SUSPENSO";
              return <div key={c.id} style={{ padding: "16px 0", borderTop: index ? "1px solid #F0F0F0" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#E0F2FE", color: "#0369A1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                  <div style={{ minWidth: 0 }}><p style={{ margin: "0 0 3px", color: "#111827", fontSize: "15px", fontWeight: 700 }}>{c.name}</p><p style={{ margin: 0, color: "#6B7280", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email || "Sem e-mail"} · Login: {c.login}</p></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap" }}>
                  <span style={{ color: suspenso ? "#B45309" : "#047857", background: suspenso ? "#FFFBEB" : "#ECFDF5", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: 700 }}>{suspenso ? "Suspenso" : "Ativo"}</span>
                  {suspenso ? <button onClick={async () => { await reativarCliente(c.id); await carregar(); }} style={actionButton("#10B981")}>Reativar</button> : <button onClick={async () => { if (confirm("Suspender este cliente? Ele perderá o acesso à plataforma.")) { await suspenderCliente(c.id); await carregar(); } }} style={actionButton("#F59E0B")}>Suspender</button>}
                  <button onClick={async () => { if (confirm("Excluir este cliente da operação? O histórico será preservado, mas o acesso será bloqueado.")) { await excluirCliente(c.id); await carregar(); } }} style={actionButton("#EF4444")}>Excluir</button>
                </div>
              </div>;
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
