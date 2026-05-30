"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { getPropostasComprador, confirmarComprador } from "@/app/actions/negociacao";
import CompradorSidebar from "@/app/components/layout/CompradorSidebar";

type PropostaDB = {
  id: number; servico: string; status: string; vendedorConfirmou: boolean;
  compradorConfirmou: boolean; documentoCompra: string | null; createdAt: string;
  Listagem: { isoTipo: string; titulo: string; preco: number } | null;
  Vendedor: { name: string } | null;
};

const statusColors: Record<string, { bg: string; text: string }> = {
  CONCLUIDA:            { bg: "#DCFCE7", text: "#16A34A" },
  PENDENTE:             { bg: "#FEF3C7", text: "#92400E" },
  VENDEDOR_CONFIRMOU:   { bg: "#DBEAFE", text: "#1E40AF" },
  COMPRADOR_CONFIRMOU:  { bg: "#FDE68A", text: "#92400E" },
  CANCELADA:            { bg: "#FEE2E2", text: "#991B1B" },
};
const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  VENDEDOR_CONFIRMOU: "Certificadora confirmou",
  COMPRADOR_CONFIRMOU: "Você confirmou",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default function CompradorHome() {
  const router = useRouter();
  const [propostas, setPropostas] = useState<PropostaDB[]>([]);
  const [user, setUser] = useState<any>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [erro, setErro] = useState("");

  const carregarPropostas = async () => {
    const res = await getPropostasComprador();
    if (res.success && res.propostas) setPropostas(res.propostas as any);
  };

  useEffect(() => { carregarPropostas(); getSession().then(setUser); }, []);

  const handleConfirmarComprador = async (propostaId: number) => {
    setErro("");
    if (!uploadFile) { setErro("Envie o comprovante da compra antes de confirmar."); return; }
    setUploadingId(propostaId);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) { setErro(uploadData.error); setUploadingId(null); return; }
      const res = await confirmarComprador(propostaId, uploadData.url);
      if (!res.success) setErro(res.error || "Erro ao confirmar.");
      setUploadFile(null);
      carregarPropostas();
    } catch { setErro("Erro ao processar."); }
    setUploadingId(null);
  };

  const pendentes = propostas.filter((p) => !["CONCLUIDA", "CANCELADA"].includes(p.status)).length;
  const concluidas = propostas.filter((p) => p.status === "CONCLUIDA").length;

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
          {/* Cards de resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Total", value: propostas.length, color: "#6001D3", bg: "#EDE9FE" },
              { label: "Em andamento", value: pendentes, color: "#F59E0B", bg: "#FFFBEB" },
              { label: "Concluídas", value: concluidas, color: "#059669", bg: "#ECFDF5" },
            ].map((c) => (
              <div key={c.label} style={{ background: "#fff", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 4px 16px rgba(80,0,160,0.08)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: c.color }}>{c.value}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Lista de propostas */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111", margin: 0 }}>Minhas Propostas</h2>
              <button onClick={() => router.push("/comprador/buscar")}
                style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "10px", padding: "9px 20px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                + Buscar ISO
              </button>
            </div>

            {erro && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "12px", color: "#B91C1C", fontSize: "13px", marginBottom: "16px" }}>{erro}</div>}

            {propostas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
                <p style={{ color: "#374151", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>Nenhuma proposta ainda</p>
                <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 24px" }}>Busque serviços ISO para iniciar uma negociação.</p>
                <button onClick={() => router.push("/comprador/buscar")}
                  style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "12px 28px", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Buscar ISO
                </button>
              </div>
            ) : propostas.map((p, i) => {
              const sc = statusColors[p.status] || statusColors.PENDENTE;
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 0", borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "20px" }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginBottom: "3px" }}>{p.Listagem?.titulo || p.servico}</div>
                    <div style={{ fontSize: "12px", color: "#7B00D4", fontWeight: 500 }}>{p.Listagem?.isoTipo || ""} · {p.Vendedor?.name || ""}</div>
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                      {p.vendedorConfirmou && <span style={{ color: "#22C55E", marginRight: "8px" }}>✓ Certificadora confirmou</span>}
                      {p.compradorConfirmou && <span style={{ color: "#22C55E" }}>✓ Você confirmou</span>}
                    </div>
                  </div>
                  <span style={{ background: sc.bg, color: sc.text, fontSize: "12px", fontWeight: 700, padding: "6px 16px", borderRadius: "20px", flexShrink: 0 }}>
                    {statusLabels[p.status] || p.status}
                  </span>
                  <button onClick={() => router.push(`/chat/${p.id}`)}
                    style={{ padding: "6px 14px", borderRadius: "8px", background: "#EDE9FE", color: "#6001D3", border: "1.5px solid #DDD6FE", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                    💬 Chat
                  </button>
                  {!p.compradorConfirmou && p.status !== "CANCELADA" && p.status !== "CONCLUIDA" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "170px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", border: "1.5px dashed #D5D5D5", borderRadius: "8px", cursor: "pointer", fontSize: "11px", color: "#888" }}>
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }} />
                        📎 {uploadFile ? uploadFile.name.slice(0, 18) : "Comprovante"}
                      </label>
                      <button onClick={() => handleConfirmarComprador(p.id)} disabled={uploadingId === p.id}
                        style={{ padding: "6px 14px", borderRadius: "8px", background: "#22C55E", color: "#fff", border: "none", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}>
                        {uploadingId === p.id ? "Enviando..." : "✓ Confirmar compra"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}