"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMensagens, enviarMensagem, marcarMensagensLidas } from "@/app/actions/chat";
import { confirmarNegociacao } from "@/app/actions/negociacao";
import { criarAvaliacao } from "@/app/actions/avaliacoes";
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
  vendedorConfirmou: boolean;
  compradorConfirmou: boolean;
  listagemId: number | null;
  compradorId: string | null;
};

const TIER_STYLE: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  BRONZE:  { label: "Bronze",  bg: "#FDF1E8", text: "#92400E", border: "#CD7F32", icon: "🥉" },
  PRATA:   { label: "Prata",   bg: "#F3F4F6", text: "#4B5563", border: "#9E9E9E", icon: "🥈" },
  OURO:    { label: "Ouro",    bg: "#FFFBEB", text: "#92400E", border: "#FFD700", icon: "🥇" },
  PLATINA: { label: "Platina", bg: "#F5F3FF", text: "#6001D3", border: "#A855F7", icon: "💎" },
};

const STATUS_LABEL: Record<string, string> = {
  CONTATO_SOLICITADO: "Contato Solicitado",
  EM_CONTATO:         "Em Contato",
  PROPOSTA_ENVIADA:   "Proposta Enviada",
  EM_NEGOCIACAO:      "Em Negociação",
  PROPOSTA_FECHADA:   "Negociação Concluída",
  CANCELADA:          "Cancelada",
};

function StarRating({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ fontSize: "32px", cursor: onChange ? "pointer" : "default", color: star <= (hover || value) ? "#F59E0B" : "rgba(255,255,255,0.3)", transition: "color 0.15s", userSelect: "none" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function NegociacaoModal({
  proposta,
  sessionId,
  sessionRole,
  propostaId,
  onClose,
  onConcluida,
}: {
  proposta: PropostaInfo;
  sessionId: string;
  sessionRole: string;
  propostaId: number;
  onClose: () => void;
  onConcluida: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");

  const isComprador = proposta.compradorId === sessionId;
  const isVendedor = sessionRole === "VENDEDOR" || sessionRole === "FUNCIONARIO";
  const euConfirmei = isComprador ? proposta.compradorConfirmou : isVendedor ? proposta.vendedorConfirmou : false;

  const handleConfirmar = async () => {
    setConfirmando(true);
    setErro("");
    const res = await confirmarNegociacao(propostaId);
    setConfirmando(false);
    if (!res.success) {
      setErro(res.error ?? "Erro ao confirmar");
      return;
    }
    if (res.fechada) {
      onConcluida();
    } else {
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "460px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "linear-gradient(135deg,#6001D3,#A872F0)", padding: "24px 28px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "18px", fontWeight: 800 }}>Concluir Negociação</h2>
            <p style={{ color: "rgba(255,255,255,0.75)", margin: "4px 0 0", fontSize: "13px" }}>{proposta.servico}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "28px" }}>
          <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.6, marginTop: 0, marginBottom: "24px" }}>
            Ambas as partes precisam confirmar para encerrar a negociação. Após a conclusão, o comprador poderá avaliar a certificadora.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "12px", background: proposta.vendedorConfirmou ? "#F0FDF4" : "#F9FAFB", border: `1.5px solid ${proposta.vendedorConfirmou ? "#86EFAC" : "#E5E7EB"}` }}>
              <span style={{ fontSize: "20px" }}>{proposta.vendedorConfirmou ? "✅" : "⏳"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#111" }}>Certificadora — {proposta.vendedorNome}</div>
                <div style={{ fontSize: "12px", color: proposta.vendedorConfirmou ? "#166534" : "#9CA3AF" }}>
                  {proposta.vendedorConfirmou ? "Confirmou a conclusão" : "Aguardando confirmação"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "12px", background: proposta.compradorConfirmou ? "#F0FDF4" : "#F9FAFB", border: `1.5px solid ${proposta.compradorConfirmou ? "#86EFAC" : "#E5E7EB"}` }}>
              <span style={{ fontSize: "20px" }}>{proposta.compradorConfirmou ? "✅" : "⏳"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#111" }}>Comprador — {proposta.compradorNome}</div>
                <div style={{ fontSize: "12px", color: proposta.compradorConfirmou ? "#166534" : "#9CA3AF" }}>
                  {proposta.compradorConfirmou ? "Confirmou a conclusão" : "Aguardando confirmação"}
                </div>
              </div>
            </div>
          </div>

          {erro && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "10px 14px", color: "#B91C1C", fontSize: "13px", marginBottom: "16px" }}>
              {erro}
            </div>
          )}

          {!euConfirmei && (isComprador || isVendedor) ? (
            <button
              onClick={handleConfirmar}
              disabled={confirmando}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px", cursor: confirmando ? "not-allowed" : "pointer", opacity: confirmando ? 0.7 : 1, transition: "opacity 0.2s" }}
            >
              {confirmando ? "Confirmando..." : "✅ Confirmar Conclusão"}
            </button>
          ) : euConfirmei ? (
            <div style={{ textAlign: "center", color: "#166534", fontWeight: 600, fontSize: "14px", padding: "12px", background: "#F0FDF4", borderRadius: "12px" }}>
              Você já confirmou. Aguardando a outra parte.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AvaliacaoModal({
  proposta,
  propostaId,
  onClose,
}: {
  proposta: PropostaInfo;
  propostaId: number;
  onClose: () => void;
}) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const handleEnviar = async () => {
    if (nota === 0) { setErro("Selecione uma nota de 1 a 5 estrelas."); return; }
    if (!comentario.trim()) { setErro("Escreva um comentário sobre sua experiência."); return; }
    if (!proposta.listagemId) { setErro("Listagem não encontrada."); return; }

    setEnviando(true);
    setErro("");
    const res = await criarAvaliacao(proposta.listagemId, nota, comentario);
    setEnviando(false);
    if (res.success) {
      setSucesso(true);
    } else {
      setErro(res.error ?? "Erro ao enviar avaliação.");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", width: "100%", maxWidth: "460px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "linear-gradient(135deg,#6001D3,#A872F0)", padding: "24px 28px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ color: "#fff", margin: 0, fontSize: "18px", fontWeight: 800 }}>Avaliar Certificadora</h2>
            <p style={{ color: "rgba(255,255,255,0.75)", margin: "4px 0 0", fontSize: "13px" }}>{proposta.vendedorNome}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "28px" }}>
          {sucesso ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>⭐</div>
              <h3 style={{ color: "#111", margin: "0 0 8px", fontSize: "18px", fontWeight: 800 }}>Obrigado pelo feedback!</h3>
              <p style={{ color: "#6B7280", fontSize: "14px", margin: "0 0 24px" }}>Sua avaliação foi enviada com sucesso.</p>
              <button onClick={onClose} style={{ padding: "12px 28px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
                Fechar
              </button>
            </div>
          ) : (
            <>
              <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.6, marginTop: 0, marginBottom: "20px" }}>
                Como foi sua experiência com a certificadora nesta negociação?
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>Sua nota *</label>
                <StarRating value={nota} onChange={setNota} />
                {nota > 0 && (
                  <span style={{ fontSize: "13px", color: "#6B7280", marginTop: "6px", display: "block" }}>
                    {["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][nota]}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Comentário *</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  placeholder="Conte sobre sua experiência com este serviço ISO..."
                  style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }}
                  onFocus={(e) => (e.target.style.borderColor = "#6001D3")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>

              {erro && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "10px 14px", color: "#B91C1C", fontSize: "13px", marginBottom: "16px" }}>
                  {erro}
                </div>
              )}

              <button
                onClick={handleEnviar}
                disabled={enviando}
                style={{ width: "100%", padding: "14px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px", cursor: enviando ? "not-allowed" : "pointer", opacity: enviando ? 0.7 : 1, transition: "opacity 0.2s" }}
              >
                {enviando ? "Enviando..." : "✉ Enviar Avaliação"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [showNegociacaoModal, setShowNegociacaoModal] = useState(false);
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const carregar = async (scroll = false) => {
    const res = await getMensagens(propostaId);
    if (!res.success) {
      if (res.error === "Sem permissão" || res.error === "Não autenticado") setSemPermissao(true);
      setLoading(false);
      return;
    }
    setMensagens((res.mensagens as Mensagem[]) ?? []);
    setProposta(res.proposta as PropostaInfo ?? null);
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

  const handleNegociacaoConcluida = async () => {
    setShowNegociacaoModal(false);
    await carregar(false);
  };

  const rankStyle = TIER_STYLE[proposta?.vendedorRankTier ?? "BRONZE"] ?? TIER_STYLE.BRONZE;

  const isFechada = proposta?.status === "PROPOSTA_FECHADA";
  const isCancelada = proposta?.status === "CANCELADA";
  const isComprador = proposta?.compradorId === sessionId;
  const podeVerBotaoNegociacao = !isFechada && !isCancelada && sessionRole !== "ADMIN";

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
      {/* Modais */}
      {showNegociacaoModal && proposta && (
        <NegociacaoModal
          proposta={proposta}
          sessionId={sessionId}
          sessionRole={sessionRole}
          propostaId={propostaId}
          onClose={() => setShowNegociacaoModal(false)}
          onConcluida={handleNegociacaoConcluida}
        />
      )}
      {showAvaliacaoModal && proposta && (
        <AvaliacaoModal
          proposta={proposta}
          propostaId={propostaId}
          onClose={() => setShowAvaliacaoModal(false)}
        />
      )}

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
            <span style={{ background: isFechada ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.2)", color: "#fff", fontSize: "11px", padding: "2px 10px", borderRadius: "12px" }}>
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

      {/* Banner de negociação concluída */}
      {isFechada && (
        <div style={{ background: "rgba(34,197,94,0.2)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(34,197,94,0.3)", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🎉</span>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>Negociação concluída com sucesso!</span>
          </div>
          {isComprador && proposta?.listagemId && (
            <button
              onClick={() => setShowAvaliacaoModal(true)}
              style={{ padding: "8px 18px", background: "#fff", color: "#6001D3", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", flexShrink: 0 }}
            >
              ⭐ Avaliar Certificadora
            </button>
          )}
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
        ) : isCancelada ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "13px", padding: "12px" }}>
            Esta proposta foi cancelada. O chat está encerrado.
          </div>
        ) : isFechada ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "12px 20px", background: "rgba(34,197,94,0.15)", borderRadius: "12px", border: "1px solid rgba(34,197,94,0.3)" }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 600 }}>Negociação encerrada. O chat está em modo somente leitura.</span>
            {isComprador && proposta?.listagemId && (
              <button
                onClick={() => setShowAvaliacaoModal(true)}
                style={{ padding: "8px 16px", background: "#fff", color: "#6001D3", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", flexShrink: 0 }}
              >
                ⭐ Avaliar
              </button>
            )}
          </div>
        ) : (
          <>
            {erro && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "8px 12px", color: "#B91C1C", fontSize: "12px", marginBottom: "10px" }}>
                {erro}
              </div>
            )}
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
              {podeVerBotaoNegociacao && (
                <button
                  onClick={() => setShowNegociacaoModal(true)}
                  style={{ padding: "12px 18px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "14px", fontWeight: 700, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", height: "fit-content", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                >
                  🤝 Concluir
                </button>
              )}
              <button
                onClick={handleEnviar}
                disabled={enviando || !texto.trim()}
                style={{ padding: "12px 24px", background: texto.trim() ? "#fff" : "rgba(255,255,255,0.3)", color: texto.trim() ? "#6001D3" : "rgba(255,255,255,0.5)", border: "none", borderRadius: "14px", fontWeight: 800, fontSize: "14px", cursor: texto.trim() ? "pointer" : "not-allowed", transition: "all 0.2s", whiteSpace: "nowrap", height: "fit-content" }}
              >
                {enviando ? "..." : "Enviar ↑"}
              </button>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `* { box-sizing: border-box; }` }} />
    </div>
  );
}
