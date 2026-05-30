"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMinhasConversas } from "@/app/actions/chat";
import CompradorSidebar from "@/app/components/layout/CompradorSidebar";

type Conversa = {
  id: number; titulo: string; isoTipo: string;
  compradorNome: string; compradorImagem: string | null;
  vendedorNome: string; vendedorImagem: string | null; vendedorRankTier: string;
  status: string;
  ultimaMensagem: { texto: string; remetente: string; createdAt: string | Date } | null;
  naoLidas: number; updatedAt: string | Date;
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  VENDEDOR_CONFIRMOU: "Certificadora confirmou",
  COMPRADOR_CONFIRMOU: "Você confirmou",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDENTE:            { bg: "#FEF3C7", text: "#92400E" },
  VENDEDOR_CONFIRMOU:  { bg: "#DBEAFE", text: "#1E40AF" },
  COMPRADOR_CONFIRMOU: { bg: "#FDE68A", text: "#92400E" },
  CONCLUIDA:           { bg: "#DCFCE7", text: "#166534" },
  CANCELADA:           { bg: "#FEE2E2", text: "#991B1B" },
};
const RANK_BADGE: Record<string, { icon: string; label: string; color: string }> = {
  PRATA:   { icon: "🥈", label: "Prata",   color: "#4B5563" },
  OURO:    { icon: "🥇", label: "Ouro",    color: "#92400E" },
  PLATINA: { icon: "💎", label: "Platina", color: "#6001D3" },
};

function Avatar({ nome, imagem, size = 44 }: { nome: string; imagem?: string | null; size?: number }) {
  if (imagem) return <img src={imagem} alt={nome} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  const cor = ["#6001D3","#0891B2","#059669","#D97706","#DC2626"][nome.charCodeAt(0) % 5];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: cor + "20", border: `2px solid ${cor}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: size * 0.38, fontWeight: 800, color: cor }}>
      {nome[0]?.toUpperCase()}
    </div>
  );
}

function tempo(data: string | Date) {
  const diff = Date.now() - new Date(data).getTime();
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function CompradorChatPage() {
  const router = useRouter();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "nao_lidas">("todas");

  useEffect(() => {
    getMinhasConversas().then((res) => {
      if (res.success) setConversas(res.conversas as any);
      setLoading(false);
    });
  }, []);

  const lista = filtro === "nao_lidas" ? conversas.filter((c) => c.naoLidas > 0) : conversas;
  const totalNaoLidas = conversas.reduce((acc, c) => acc + c.naoLidas, 0);

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>
            Conversas
            {totalNaoLidas > 0 && (
              <span style={{ marginLeft: "12px", background: "#EF4444", color: "#fff", fontSize: "14px", fontWeight: 800, padding: "3px 10px", borderRadius: "20px", verticalAlign: "middle" }}>
                {totalNaoLidas}
              </span>
            )}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>Todas as suas conversas com certificadoras</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["todas", "nao_lidas"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{ padding: "8px 18px", borderRadius: "10px", border: "none", fontWeight: 700, fontSize: "13px", cursor: "pointer", background: filtro === f ? "#fff" : "rgba(255,255,255,0.15)", color: filtro === f ? "#6001D3" : "#fff", transition: "all 0.2s" }}>
              {f === "todas" ? "Todas" : `Não lidas${totalNaoLidas > 0 ? ` (${totalNaoLidas})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <CompradorSidebar />

        <div style={{ flex: 1, background: "#fff", borderRadius: "20px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", overflowY: "auto" }}>
          {loading ? (
            <p style={{ color: "#9CA3AF", textAlign: "center", padding: "60px 0" }}>Carregando conversas...</p>
          ) : lista.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>💬</div>
              <p style={{ color: "#374151", fontSize: "16px", fontWeight: 700, margin: "0 0 6px" }}>
                {filtro === "nao_lidas" ? "Nenhuma mensagem não lida" : "Nenhuma conversa ainda"}
              </p>
              <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
                {filtro === "nao_lidas" ? "Você está em dia!" : "Busque serviços ISO e inicie uma proposta para conversar."}
              </p>
            </div>
          ) : lista.map((c, i) => {
            const sc = STATUS_COLOR[c.status] ?? STATUS_COLOR.PENDENTE;
            const rank = RANK_BADGE[c.vendedorRankTier];
            return (
              <div key={c.id} onClick={() => router.push(`/chat/${c.id}`)}
                style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 24px", borderTop: i > 0 ? "1px solid #F3F4F6" : "none", cursor: "pointer", background: c.naoLidas > 0 ? "#FAFBFF" : "transparent", transition: "background 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F9F5FF"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = c.naoLidas > 0 ? "#FAFBFF" : "transparent"; }}
              >
                <Avatar nome={c.vendedorNome} imagem={c.vendedorImagem} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "14px", fontWeight: c.naoLidas > 0 ? 800 : 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.vendedorNome}
                    </span>
                    {rank && <span style={{ fontSize: "11px", color: rank.color, flexShrink: 0 }}>{rank.icon} {rank.label}</span>}
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "8px", background: "#EDE9FE", color: "#6001D3", flexShrink: 0 }}>{c.isoTipo}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.titulo}</div>
                  {c.ultimaMensagem ? (
                    <div style={{ fontSize: "12px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 600 }}>{c.ultimaMensagem.remetente}:</span> {c.ultimaMensagem.texto}
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "#D1D5DB", fontStyle: "italic" }}>Sem mensagens ainda</div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                  <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{c.ultimaMensagem ? tempo(c.ultimaMensagem.createdAt) : ""}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: sc.bg, color: sc.text }}>{STATUS_LABEL[c.status] ?? c.status}</span>
                  {c.naoLidas > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "20px", minWidth: "20px", textAlign: "center" }}>{c.naoLidas}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}