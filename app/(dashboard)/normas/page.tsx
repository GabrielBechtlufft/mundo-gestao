"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import { excluirListagemAdmin, getNormasAdmin, suspenderListagemAdmin } from "@/app/actions/admin";

type Norma = { id: number; isoTipo: string; titulo: string; tipoServico: string | null; categoriaServico: string | null; estado: string; status: string; User: { name: string; razaoSocial: string | null } | null };

const statusStyle: Record<string, { label: string; color: string; background: string }> = {
  ATIVA: { label: "Ativa", color: "#047857", background: "#ECFDF5" },
  PAUSADA: { label: "Pausada", color: "#B45309", background: "#FFFBEB" },
  REMOVIDA: { label: "Removida", color: "#B91C1C", background: "#FEF2F2" },
  PENDENTE_APROVACAO: { label: "Pendente", color: "#6D28D9", background: "#F5F3FF" },
  REJEITADA: { label: "Rejeitada", color: "#B91C1C", background: "#FEF2F2" },
};

export default function NormasAdminPage() {
  const [normas, setNormas] = useState<Norma[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const carregar = async () => { setLoading(true); const res = await getNormasAdmin(); if (res.success) setNormas(res.normas as Norma[]); setLoading(false); };
  useEffect(() => { void carregar(); }, []);

  const filtradas = normas.filter((n) => `${n.isoTipo} ${n.titulo} ${n.tipoServico || ""} ${n.categoriaServico || ""} ${n.estado} ${n.User?.razaoSocial || n.User?.name || ""}`.toLowerCase().includes(busca.toLowerCase()));
  const ativas = normas.filter((n) => n.status === "ATIVA").length;

  return <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
    <div style={{ margin: "8px 0 28px" }}><h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.5px" }}>Normas cadastradas</h1><p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>Acompanhe e gerencie as listagens de normas das certificadoras.</p></div>
    <div style={{ display: "flex", gap: "24px", minHeight: 0, flex: 1 }}><Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflow: "auto", background: "#fff", borderRadius: "20px", padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "18px", flexWrap: "wrap", marginBottom: "22px" }}>
          <div style={{ display: "flex", gap: "12px" }}><div style={{ borderRadius: "12px", background: "#F5F3FF", padding: "10px 14px", minWidth: "118px" }}><div style={{ color: "#7C3AED", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Total</div><div style={{ color: "#3B0764", fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{normas.length}</div></div><div style={{ borderRadius: "12px", background: "#ECFDF5", padding: "10px 14px", minWidth: "118px" }}><div style={{ color: "#047857", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Ativas</div><div style={{ color: "#065F46", fontSize: "20px", fontWeight: 800, marginTop: "2px" }}>{ativas}</div></div></div>
          <div style={{ width: "min(100%, 390px)", position: "relative" }}><span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}>⌕</span><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por norma, serviço, estado ou certificadora" style={{ width: "100%", height: "42px", boxSizing: "border-box", padding: "0 14px 0 36px", borderRadius: "10px", border: "1.5px solid #E5E7EB", color: "#111827", outline: "none", fontSize: "13px" }} /></div>
        </div>
        <div style={{ borderTop: "1px solid #F0F0F0" }}>{loading ? <p style={{ color: "#9CA3AF", textAlign: "center", padding: "42px 0", margin: 0 }}>Carregando normas...</p> : filtradas.length === 0 ? <div style={{ textAlign: "center", padding: "52px 16px", color: "#9CA3AF" }}><div style={{ fontSize: "30px", marginBottom: "10px" }}>📋</div><strong style={{ color: "#6B7280" }}>{busca ? "Nenhuma norma encontrada" : "Nenhuma norma cadastrada"}</strong><p style={{ fontSize: "13px", margin: "6px 0 0" }}>{busca ? "Tente ajustar os termos da busca." : "As listagens criadas pelas certificadoras aparecerão aqui."}</p></div> : filtradas.map((n, index) => { const status = statusStyle[n.status] || { label: n.status, color: "#374151", background: "#F3F4F6" }; return <div key={n.id} style={{ padding: "16px 0", borderTop: index ? "1px solid #F0F0F0" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}><div style={{ display: "flex", alignItems: "flex-start", gap: "14px", minWidth: 0 }}><div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#EDE9FE", color: "#6D28D9", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: 800, flexShrink: 0 }}>ISO</div><div style={{ minWidth: 0 }}><p style={{ margin: "0 0 4px", fontSize: "15px", color: "#111827", fontWeight: 700 }}>{n.isoTipo} <span style={{ color: "#9CA3AF", fontWeight: 400 }}>—</span> {n.titulo}</p><p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>{n.tipoServico || "Sem serviço"} · {n.categoriaServico || "Sem categoria"} · {n.estado || "Sem estado"}</p><p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9CA3AF" }}>{n.User?.razaoSocial || n.User?.name || "Sem certificadora"}</p></div></div><div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap" }}><span style={{ color: status.color, background: status.background, padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>{status.label}</span>{n.status === "ATIVA" && <button onClick={async () => { await suspenderListagemAdmin(n.id); await carregar(); }} style={{ padding: "7px 14px", borderRadius: "8px", border: "1.5px solid #F59E0B", color: "#F59E0B", fontWeight: 600, fontSize: "12px", background: "transparent", cursor: "pointer" }}>Suspender</button>}<button onClick={async () => { if (confirm("Excluir esta norma da busca?")) { await excluirListagemAdmin(n.id); await carregar(); } }} style={{ padding: "7px 14px", borderRadius: "8px", border: "1.5px solid #EF4444", color: "#EF4444", fontWeight: 600, fontSize: "12px", background: "transparent", cursor: "pointer" }}>Excluir</button></div></div>; })}</div>
      </main>
    </div>
  </div>;
}
