"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMensagens, enviarMensagem, marcarMensagensLidas } from "@/app/actions/chat";
import { Logo } from "@/app/components/layout/Logo";
import Link from "next/link";

type Mensagem = {
  id: number;
  texto: string;
  lida: boolean;
  createdAt: string | Date;
  remetenteId: string;
  Remetente: { id: string; name: string; role: string };
};

type PropostaInfo = {
  servico: string;
  status: string;
  compradorNome: string;
  vendedorNome: string;
  vendedorRankTier: string;
};

const TIER_STYLE: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  BRONZE:  { label: "Bronze",  bg: "#FDF1E8", text: "#92400E", border: "#CD7F32", icon: "🥉" },
  PRATA:   { label: "Prata",   bg: "#F3F4F6", text: "#4B5563", border: "#9E9E9E", icon: "🥈" },
  OURO:    { label: "Ouro",    bg: "#FFFBEB", text: "#92400E", border: "#FFD700", icon: "🥇" },
  PLATINA: { label: "Platina", bg: "#F5F3FF", text: "#6001D3", border: "#A855F7", icon: "💎" },
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  VENDEDOR_CONFIRMOU: "Certificadora confirmou",
  COMPRADOR_CONFIRMOU: "Comprador confirmou",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const propostaId = Number(params.propostaId);

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [proposta, setProposta] = useState<PropostaInfo | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionRole, setSessionRole] = useState<string>("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [semPermissao, setSemPermissao] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const carregar = async (scroll = false) => {
    const res = await getMensagens(propostaId);
    if (!res.success) {
      if (res.error === "Sem permissão" || res.error === "Não autenticado") {
        setSemPermissao(true);
      }
      setLoading(false);
      return;
    }
    setMensagens((res.mensagens as Mensagem[]) ?? []);
    setProposta(res.proposta ?? null);
    setSessionId(res.sessionId ?? "");
    setSessionRole((res as any).sessionRole ?? "");
    setLoading(false);
    if (scroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    await marcarMensagensLidas(propostaId);
  };

  useEffect(() => {
    carregar(true);
    const interval = setInterval(() => carregar(false), 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propostaId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    setErro("");
    const res = await enviarMensagem(propostaId, texto.trim());
    if (res.success) {
      setTexto("");
      await carregar(true);
    } else {
      setErro(res.error ?? "Erro ao enviar mensagem");
    }
    setEnviando(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const rankStyle = TIER_STYLE[proposta?.vendedorRankTier ?? "BRONZE"] ?? TIER_STYLE.BRONZE;

  if (semPermissao) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#6001D3,#A872F0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "40px", textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: "#111", fontWeight: 800 }}>Sem acesso</h2>
          <p style={{ color: "#888" }}>Você não tem permissão para acessar este chat.</p>
          <button onClick={() => router.back()} style={{ marginTop: "20px", padding: "12px 28px", background: "#6001D3", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#6001D3,#A872F0)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", background: "rgba(0,0,0,0.15)", backdropFilter: "blur(8px)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
            ← Voltar
          </button>
          <Link href="/" className="no-underline">
            <Logo size="sm" />
          </Link>
        </div>
        {proposta && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {proposta.servico}
            </span>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "11px", padding: "2px 10px", borderRadius: "12px" }}>
              {STATUS_LABEL[proposta.status] ?? proposta.status}
            </span>
          </div>
        )}
      </header>

      {/* Participants bar */}
      {proposta && (
        <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "10px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "13px" }}>
              {proposta.compradorNome[0]}
            </div>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{proposta.compradorNome}</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Comprador</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "18px" }}>↔</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Certificadora</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: rankStyle.bg, border: `1.5px solid ${rankStyle.border}`, borderRadius: "20px", padding: "3px 10px 3px 6px" }}>
              <span style={{ fontSize: "14px" }}>{rankStyle.icon}</span>
              <span style={{ color: rankStyle.text, fontSize: "11px", fontWeight: 700 }}>{rankStyle.label}</span>
            </div>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{proposta.vendedorNome}</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "13px" }}>
              {proposta.vendedorNome[0]}
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", paddingTop: "60px" }}>Carregando...</div>
        ) : mensagens.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", paddingTop: "60px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
            <p style={{ fontSize: "15px" }}>Nenhuma mensagem ainda. Seja o primeiro a escrever!</p>
          </div>
        ) : (
          mensagens.map((m) => {
            const isMe = m.remetenteId === sessionId;
            const ts = new Date(m.createdAt);
            const time = ts.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            const date = ts.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexDirection: isMe ? "row-reverse" : "row" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isMe ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {m.Remetente.name[0]}
                  </div>
                  <div style={{ maxWidth: "65%", background: isMe ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", backdropFilter: "blur(8px)" }}>
                    {!isMe && (
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>
                        {m.Remetente.name}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: "14px", color: isMe ? "#1a1a1a" : "#fff", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {m.texto}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginTop: "4px", marginLeft: isMe ? 0 : "36px", marginRight: isMe ? "36px" : 0 }}>
                  {date} {time} {isMe && m.lida ? "· Lida" : ""}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: "16px 32px 24px", background: "rgba(0,0,0,0.15)", backdropFilter: "blur(8px)", flexShrink: 0 }}>
        {sessionRole === "ADMIN" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", background: "rgba(255,255,255,0.1)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ fontSize: "16px" }}>👁️</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 600 }}>
              Você está visualizando este chat como administrador — somente leitura.
            </span>
          </div>
        ) : (
          <>
            {erro && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "8px 12px", color: "#B91C1C", fontSize: "12px", marginBottom: "10px" }}>
                {erro}
              </div>
            )}
            {proposta?.status === "CANCELADA" ? (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "13px", padding: "12px" }}>
                Esta proposta foi cancelada. O chat está encerrado.
              </div>
            ) : (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                <textarea
                  ref={inputRef}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem… (Enter para enviar, Shift+Enter para nova linha)"
                  rows={2}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: "14px", border: "none", fontSize: "14px", resize: "none", outline: "none", background: "rgba(255,255,255,0.95)", color: "#111", lineHeight: 1.5, fontFamily: "inherit" }}
                />
                <button
                  onClick={handleEnviar}
                  disabled={enviando || !texto.trim()}
                  style={{ padding: "12px 24px", background: texto.trim() ? "#fff" : "rgba(255,255,255,0.3)", color: texto.trim() ? "#6001D3" : "rgba(255,255,255,0.5)", border: "none", borderRadius: "14px", fontWeight: 800, fontSize: "14px", cursor: texto.trim() ? "pointer" : "not-allowed", transition: "all 0.2s", whiteSpace: "nowrap", height: "fit-content" }}
                >
                  {enviando ? "..." : "Enviar ↑"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `* { box-sizing: border-box; }` }} />
    </div>
  );
}
