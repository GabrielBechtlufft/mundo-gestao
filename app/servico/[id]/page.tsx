"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAvaliacoes, criarAvaliacao } from "@/app/actions/avaliacoes";
import { solicitarOrcamento } from "@/app/actions/negociacao";
import { getSession } from "@/app/actions/auth";
import Link from "next/link";
import { Logo } from "@/app/components/layout/Logo";
import PlanetBackground from "@/app/components/layout/PlanetBackground";

type Listagem = {
  id: number;
  isoTipo: string;
  titulo: string;
  descricao: string;
  cidade: string;
  destaque: string | null;
  imagem: string | null;
  status: string;
  visualizacoes: number;
  User: { name: string; rankTier?: string } | null;
};

type Avaliacao = {
  id: number;
  nomeAvaliador: string;
  nota: number;
  comentario: string;
  createdAt: string | Date;
};

function StarRating({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{
            fontSize: "28px",
            cursor: onChange ? "pointer" : "default",
            color: star <= (hover || value) ? "#F59E0B" : "#E5E7EB",
            transition: "color 0.15s",
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function AvaliacaoCard({ av }: { av: Avaliacao }) {
  const date = new Date(av.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return (
    <div
      style={{
        background: "#FAFAFA",
        border: "1px solid #F0E6FF",
        borderRadius: "16px",
        padding: "20px 24px",
        marginBottom: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#111" }}>{av.nomeAvaliador}</span>
          <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "12px" }}>{date}</span>
        </div>
        <StarRating value={av.nota} />
      </div>
      <p style={{ margin: 0, color: "#444", fontSize: "14px", lineHeight: 1.6 }}>{av.comentario}</p>
    </div>
  );
}

export default function ServicoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [listagem, setListagem] = useState<Listagem | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [solicitando, setSolicitando] = useState(false);
  const [erroSolicitacao, setErroSolicitacao] = useState("");

  // Avaliações
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [erroFeedback, setErroFeedback] = useState("");

  const carregarAvaliacoes = async (lid: number) => {
    const res = await getAvaliacoes(lid);
    if (res.success) setAvaliacoes(res.avaliacoes as Avaliacao[]);
  };

  useEffect(() => {
    async function fetchListagem() {
      const res = await fetch(`/api/servico/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListagem(data);
        carregarAvaliacoes(data.id);
      }
      setLoading(false);
    }
    if (id) fetchListagem();
    getSession().then(setSession);
  }, [id]);

  const handleSolicitarOrcamento = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }
    if (session.role !== "COMPRADOR") {
      setErroSolicitacao("Apenas compradores podem solicitar orçamento.");
      return;
    }
    setSolicitando(true);
    setErroSolicitacao("");
    const res = await solicitarOrcamento(listagem!.id);
    setSolicitando(false);
    if (res.success && res.propostaId) {
      router.push(`/chat/${res.propostaId}`);
    } else {
      setErroSolicitacao("Erro ao criar proposta. Tente novamente.");
    }
  };

  const handleEnviarAvaliacao = async () => {
    setErroFeedback("");
    if (!nome.trim()) { setErroFeedback("Informe seu nome."); return; }
    if (nota === 0) { setErroFeedback("Selecione uma nota de 1 a 5 estrelas."); return; }
    if (!comentario.trim()) { setErroFeedback("Escreva um comentário."); return; }
    setEnviando(true);
    const res = await criarAvaliacao(Number(id), nome, nota, comentario);
    setEnviando(false);
    if (res.success) {
      setFeedbackMsg("Avaliação enviada com sucesso! Obrigado pelo feedback.");
      setNome("");
      setNota(0);
      setComentario("");
      carregarAvaliacoes(Number(id));
    } else {
      setErroFeedback(res.error || "Erro ao enviar avaliação.");
    }
  };

  const mediaNotas = avaliacoes.length
    ? (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #6001D3 0%, #A872F0 60%, #F0E6FF 100%)", position: "relative", overflow: "hidden" }}>
        <PlanetBackground />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <p style={{ color: "#fff", fontSize: "24px", fontWeight: 600 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!listagem) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #6001D3 0%, #A872F0 60%, #F0E6FF 100%)", position: "relative", overflow: "hidden" }}>
        <PlanetBackground />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>
          <p style={{ color: "#fff", fontSize: "24px", fontWeight: 600 }}>Serviço não encontrado.</p>
          <button onClick={() => router.back()} style={{ background: "#fff", color: "#6001D3", padding: "12px 32px", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}>← Voltar</button>
        </div>
      </div>
    );
  }

  const rankStyle: Record<string, { icon: string; label: string; bg: string; text: string; border: string }> = {
    BRONZE:  { icon: "🥉", label: "Bronze",  bg: "#FDF1E8", text: "#92400E", border: "#CD7F32" },
    PRATA:   { icon: "🥈", label: "Prata",   bg: "#F3F4F6", text: "#4B5563", border: "#9E9E9E" },
    OURO:    { icon: "🥇", label: "Ouro",    bg: "#FFFBEB", text: "#92400E", border: "#FFD700" },
    PLATINA: { icon: "💎", label: "Platina", bg: "#F5F3FF", text: "#6001D3", border: "#A855F7" },
  };
  const tier = listagem.User?.rankTier ?? "BRONZE";
  const rankBadge = rankStyle[tier] ?? rankStyle.BRONZE;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #6001D3 0%, #A872F0 60%, #F0E6FF 100%)", position: "relative", overflow: "hidden" }}>
      <PlanetBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px", color: "#fff" }}>
        <Link href="/" className="no-underline transition-transform hover:opacity-90 active:scale-95">
          <Logo size="md" />
        </Link>
        <button
          onClick={() => router.back()}
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff", padding: "10px 24px", borderRadius: "10px", fontWeight: 600, border: "1.5px solid rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "14px", backdropFilter: "blur(8px)" }}
        >
          ← Voltar
        </button>
      </header>

      <main style={{ display: "flex", justifyContent: "center", padding: "0 24px 80px" }}>
        <div style={{ width: "100%", maxWidth: "780px" }}>

          {/* ── CARD PRINCIPAL ── */}
          <div style={{ background: "#fff", borderRadius: "28px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", marginBottom: "28px" }}>

            {/* Imagem hero */}
            {listagem.imagem ? (
              <div style={{ width: "100%", height: "260px", overflow: "hidden", position: "relative" }}>
                <img src={listagem.imagem} alt={listagem.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {listagem.destaque && (
                  <span style={{ position: "absolute", top: "16px", left: "16px", background: "#22C55E", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "6px 14px", borderRadius: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {listagem.destaque}
                  </span>
                )}
              </div>
            ) : (
              <div style={{ width: "100%", height: "180px", background: "linear-gradient(135deg, #6001D3, #A872F0)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <span style={{ fontSize: "64px" }}>📋</span>
                {listagem.destaque && (
                  <span style={{ position: "absolute", top: "16px", left: "16px", background: "#22C55E", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "6px 14px", borderRadius: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {listagem.destaque}
                  </span>
                )}
              </div>
            )}

            {/* Conteúdo do card */}
            <div style={{ padding: "36px 44px 40px" }}>

              {/* Badges */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                <span style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "13px", fontWeight: 700, padding: "6px 18px", borderRadius: "20px" }}>
                  {listagem.isoTipo}
                </span>
                <span style={{ background: "#F3F4F6", color: "#555", fontSize: "13px", fontWeight: 500, padding: "6px 16px", borderRadius: "20px" }}>
                  📍 {listagem.cidade}
                </span>
                {mediaNotas && (
                  <span style={{ background: "#FFFBEB", color: "#B45309", fontSize: "13px", fontWeight: 700, padding: "6px 14px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "4px" }}>
                    ★ {mediaNotas} <span style={{ fontWeight: 400, color: "#aaa", fontSize: "12px" }}>({avaliacoes.length})</span>
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#111", lineHeight: 1.25, marginBottom: "16px", marginTop: 0 }}>
                {listagem.titulo}
              </h1>

              <p style={{ color: "#555", lineHeight: 1.75, fontSize: "15px", marginBottom: "32px" }}>
                {listagem.descricao}
              </p>

              {/* Prestador */}
              <div style={{ background: "linear-gradient(135deg, #F5F0FF, #EDE9FE)", borderRadius: "18px", padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Prestador</p>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: "#111", margin: 0 }}>{listagem.User?.name || "Consultoria Credenciada"}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: rankBadge.bg, border: `1.5px solid ${rankBadge.border}`, borderRadius: "20px", padding: "6px 14px 6px 10px" }}>
                  <span style={{ fontSize: "16px" }}>{rankBadge.icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: rankBadge.text }}>{rankBadge.label}</span>
                </div>
              </div>

              {/* Botão solicitar orçamento */}
              {erroSolicitacao && (
                <p style={{ color: "#EF4444", fontSize: "13px", fontWeight: 600, marginBottom: "12px", textAlign: "center" }}>⚠ {erroSolicitacao}</p>
              )}
              <button
                onClick={handleSolicitarOrcamento}
                disabled={solicitando}
                style={{ width: "100%", background: "linear-gradient(90deg, #6001D3, #A872F0)", color: "#fff", padding: "20px", borderRadius: "16px", fontWeight: 800, fontSize: "18px", border: "none", cursor: solicitando ? "wait" : "pointer", boxShadow: "0 8px 24px rgba(96,1,211,0.35)", transition: "opacity 0.2s", opacity: solicitando ? 0.7 : 1 }}
              >
                {solicitando ? "Abrindo chat..." : "💬 Solicitar Orçamento"}
              </button>
              <p style={{ textAlign: "center", fontSize: "12px", color: "#aaa", marginTop: "10px", marginBottom: 0 }}>
                {session ? "Você será direcionado para o chat com o prestador." : "Faça login para solicitar um orçamento."}
              </p>
            </div>
          </div>

          {/* ── SEÇÃO DE AVALIAÇÕES ── */}
          <div style={{ background: "#fff", borderRadius: "28px", padding: "36px 44px", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111", margin: "0 0 4px" }}>Opiniões sobre este serviço</h2>
                <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
                  {avaliacoes.length === 0
                    ? "Seja o primeiro a avaliar este serviço."
                    : `${avaliacoes.length} avaliação${avaliacoes.length > 1 ? "ões" : ""} · Média ${mediaNotas} ★`}
                </p>
              </div>
              {mediaNotas && (
                <div style={{ textAlign: "center", background: "linear-gradient(135deg, #F5F0FF, #EDE9FE)", borderRadius: "16px", padding: "12px 20px" }}>
                  <div style={{ fontSize: "36px", fontWeight: 900, color: "#6001D3", lineHeight: 1 }}>{mediaNotas}</div>
                  <StarRating value={Math.round(Number(mediaNotas))} />
                </div>
              )}
            </div>

            {/* Lista de avaliações */}
            {avaliacoes.length > 0 && (
              <div style={{ marginBottom: "36px" }}>
                {avaliacoes.map((av) => (
                  <AvaliacaoCard key={av.id} av={av} />
                ))}
              </div>
            )}

            {/* Divisor */}
            <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #EDE9FE, transparent)", marginBottom: "32px" }} />

            {/* Formulário de avaliação */}
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111", marginBottom: "20px", marginTop: 0 }}>
                Deixe sua avaliação
              </h3>

              {feedbackMsg ? (
                <div style={{ background: "#F0FDF4", border: "2px solid #22C55E", borderRadius: "14px", padding: "20px 24px", textAlign: "center" }}>
                  <p style={{ fontSize: "16px", color: "#166534", fontWeight: 700, margin: "0 0 8px" }}>✅ {feedbackMsg}</p>
                  <button
                    onClick={() => setFeedbackMsg("")}
                    style={{ background: "transparent", border: "none", color: "#6001D3", cursor: "pointer", fontSize: "13px", fontWeight: 600, textDecoration: "underline" }}
                  >
                    Avaliar novamente
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Nome */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#444", marginBottom: "6px" }}>Seu nome *</label>
                    <input
                      id="avaliacao-nome"
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: João Silva"
                      style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" }}
                      onFocus={(e) => (e.target.style.borderColor = "#6001D3")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>

                  {/* Nota */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#444", marginBottom: "8px" }}>Sua nota *</label>
                    <StarRating value={nota} onChange={setNota} />
                    {nota > 0 && (
                      <span style={{ fontSize: "12px", color: "#888", marginTop: "4px", display: "block" }}>
                        {["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][nota]}
                      </span>
                    )}
                  </div>

                  {/* Comentário */}
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#444", marginBottom: "6px" }}>Comentário *</label>
                    <textarea
                      id="avaliacao-comentario"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={4}
                      placeholder="Conte sobre sua experiência com este serviço ISO..."
                      style={{ width: "100%", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", resize: "vertical", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s", fontFamily: "inherit" }}
                      onFocus={(e) => (e.target.style.borderColor = "#6001D3")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>

                  {erroFeedback && (
                    <p style={{ margin: 0, color: "#EF4444", fontSize: "13px", fontWeight: 600 }}>⚠ {erroFeedback}</p>
                  )}

                  <button
                    id="btn-enviar-avaliacao"
                    onClick={handleEnviarAvaliacao}
                    disabled={enviando}
                    style={{ padding: "16px", background: "linear-gradient(90deg, #6001D3, #A872F0)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: enviando ? "not-allowed" : "pointer", opacity: enviando ? 0.7 : 1, transition: "opacity 0.2s", boxShadow: "0 6px 20px rgba(96,1,211,0.3)" }}
                  >
                    {enviando ? "Enviando..." : "✉ Enviar Avaliação"}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      </div>
    </div>
  );
}
