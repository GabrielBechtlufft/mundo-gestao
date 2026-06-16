"use client";

import { useEffect, useState } from "react";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";
import { getMinhasNormas, atualizarStatusListagem, excluirListagem } from "@/app/actions/normas";
import { useRouter } from "next/navigation";

type Listagem = { id: number; titulo: string; isoTipo: string; cidade: string; status: string; motivoRejeicao: string | null; visualizacoes: number; _count: { contatos: number } };

export default function VendedorNormasPage() {
  const router = useRouter();
  const [normas, setNormas] = useState<Listagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const carregar = async () => {
    const res = await getMinhasNormas();
    if (res.success) setNormas(res.normas as any);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleStatus = async (id: number, status: "ATIVA" | "PAUSADA") => {
    await atualizarStatusListagem(id, status);
    carregar();
  };

  const handleExcluir = async (id: number) => {
    if (!confirm("Deseja excluir esta norma?")) return;
    await excluirListagem(id);
    carregar();
  };

  const statusColor: Record<string, string> = {
    ATIVA: "#22C55E",
    PAUSADA: "#F59E0B",
    REMOVIDA: "#EF4444",
    PENDENTE_APROVACAO: "#6001D3",
    REJEITADA: "#EF4444",
  };
  const statusLabel: Record<string, string> = {
    ATIVA: "Ativa",
    PAUSADA: "Pausada",
    REMOVIDA: "Removida",
    PENDENTE_APROVACAO: "Em análise",
    REJEITADA: "Rejeitada",
  };

  const normasFiltradas = normas.filter((l) => {
    const q = busca.toLowerCase();
    const textoOk = !busca || [l.titulo, l.isoTipo, l.cidade].join(" ").toLowerCase().includes(q);
    return textoOk && (filtroStatus === "TODOS" || l.status === filtroStatus);
  });

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", margin: 0 }}>Minhas Normas</h1>
        <button
          onClick={() => router.push("/vendedor/normas/nova")}
          style={{ background: "#fff", color: "#6001D3", padding: "12px 28px", borderRadius: "12px", fontWeight: 800, fontSize: "15px", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
        >
          + Nova Norma
        </button>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <VendedorSidebar />

        <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "36px 48px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", height: "100%", overflowY: "auto" }}>
          {loading ? (
            <p style={{ color: "#888", textAlign: "center", paddingTop: "40px" }}>Carregando...</p>
          ) : normas.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "60px" }}>
              <p style={{ color: "#aaa", fontSize: "18px", marginBottom: "24px" }}>Você ainda não tem normas publicadas.</p>
              <button onClick={() => router.push("/vendedor/normas/nova")} style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "14px 32px", borderRadius: "12px", fontWeight: 800, border: "none", cursor: "pointer" }}>
                Criar primeira norma
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                <input
                  type="text"
                  placeholder="Buscar por título, norma ou cidade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{ padding: "10px 16px", borderRadius: "10px", border: "1.5px solid #E5E7EB", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box", color: "#111" }}
                />
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { key: "TODOS", label: "Todos" },
                    { key: "ATIVA", label: "Ativa" },
                    { key: "PAUSADA", label: "Pausada" },
                    { key: "PENDENTE_APROVACAO", label: "Em análise" },
                    { key: "REJEITADA", label: "Rejeitada" },
                    { key: "REMOVIDA", label: "Removida" },
                  ].map((s) => (
                    <button key={s.key} onClick={() => setFiltroStatus(s.key)}
                      style={{ padding: "5px 14px", borderRadius: "20px", border: "1.5px solid", borderColor: filtroStatus === s.key ? "#6001D3" : "#E5E7EB", background: filtroStatus === s.key ? "#6001D3" : "transparent", color: filtroStatus === s.key ? "#fff" : "#6B7280", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {normasFiltradas.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: "14px", padding: "32px 0" }}>Nenhum resultado para esta busca.</p>
              ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {normasFiltradas.map((l) => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", border: "1.5px solid #E5E7EB", borderRadius: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "12px" }}>{l.isoTipo}</span>
                      <span style={{ background: (statusColor[l.status] ?? "#ccc") + "22", color: statusColor[l.status] ?? "#ccc", fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px" }}>{statusLabel[l.status] ?? l.status}</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "16px", color: "#111", margin: "0 0 4px" }}>{l.titulo}</p>
                    <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>📍 {l.cidade} · 👁 {l.visualizacoes} visualizações · 📞 {l._count.contatos} contatos</p>
                    {l.status === "PENDENTE_APROVACAO" && (
                      <p style={{ fontSize: "12px", color: "#6001D3", margin: "6px 0 0", fontWeight: 500 }}>
                        ⏳ Aguardando revisão do administrador para ser publicada.
                      </p>
                    )}
                    {l.status === "REJEITADA" && l.motivoRejeicao && (
                      <div style={{ marginTop: "8px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "8px 12px" }}>
                        <p style={{ fontSize: "12px", color: "#B91C1C", margin: 0, fontWeight: 600 }}>
                          Motivo da rejeição: <span style={{ fontWeight: 400 }}>{l.motivoRejeicao}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginLeft: "24px" }}>
                    {l.status === "ATIVA" && (
                      <button onClick={() => handleStatus(l.id, "PAUSADA")} style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #F59E0B", color: "#F59E0B", fontWeight: 600, fontSize: "13px", background: "transparent", cursor: "pointer" }}>Pausar</button>
                    )}
                    {l.status === "PAUSADA" && (
                      <button onClick={() => handleStatus(l.id, "ATIVA")} style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #22C55E", color: "#22C55E", fontWeight: 600, fontSize: "13px", background: "transparent", cursor: "pointer" }}>Reativar</button>
                    )}
                    {l.status !== "PENDENTE_APROVACAO" && (
                      <button onClick={() => handleExcluir(l.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #EF4444", color: "#EF4444", fontWeight: 600, fontSize: "13px", background: "transparent", cursor: "pointer" }}>Excluir</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
