"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";
import { getMinhasConversas } from "@/app/actions/chat";
import { atribuirFuncionarioAChat, listarFuncionariosParaAtribuicao } from "@/app/actions/funcionarios";

type Conversa = {
  id: number; titulo: string; isoTipo: string;
  compradorNome: string; compradorImagem: string | null;
  vendedorNome: string; vendedorImagem: string | null; vendedorRankTier: string;
  status: string;
  funcionario: { id: number; nome: string } | null;
  ultimaMensagem: { texto: string; remetente: string; createdAt: string | Date } | null;
  naoLidas: number; updatedAt: string | Date;
};

type FuncOpcao = { id: number; nome: string; cargo: string | null; linkedUserId: string | null };

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  VENDEDOR_CONFIRMOU: "Você confirmou",
  COMPRADOR_CONFIRMOU: "Comprador confirmou",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDENTE: { bg: "#FEF3C7", text: "#92400E" },
  VENDEDOR_CONFIRMOU: { bg: "#DBEAFE", text: "#1E40AF" },
  COMPRADOR_CONFIRMOU: { bg: "#FDE68A", text: "#92400E" },
  CONCLUIDA: { bg: "#DCFCE7", text: "#166534" },
  CANCELADA: { bg: "#FEE2E2", text: "#991B1B" },
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
  const d = new Date(data);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function ModalAtribuir({
  conversa,
  funcionarios,
  onClose,
  onSave,
}: {
  conversa: Conversa;
  funcionarios: FuncOpcao[];
  onClose: () => void;
  onSave: (propostaId: number, funcionarioId: number | null) => Promise<void>;
}) {
  const [selecionado, setSelecionado] = useState<number | null>(conversa.funcionario?.id ?? null);
  const [salvando, setSalvando] = useState(false);

  const handleSave = async () => {
    setSalvando(true);
    await onSave(conversa.id, selecionado);
    setSalvando(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(80,0,160,0.2)" }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: 800, marginTop: 0, marginBottom: "6px", color: "#111" }}>
          Atribuir funcionário
        </h2>
        <p style={{ color: "#6B7280", fontSize: "13px", margin: "0 0 24px" }}>
          Chat com <strong>{conversa.compradorNome}</strong> · {conversa.isoTipo || conversa.titulo}
        </p>

        {funcionarios.length === 0 ? (
          <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "20px" }}>
            <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>
              Nenhum funcionário ativo com conta na plataforma.
            </p>
            <p style={{ color: "#9CA3AF", fontSize: "12px", margin: "8px 0 0" }}>
              Crie contas na aba Equipe primeiro.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {/* Opção: sem atribuição */}
            <button
              onClick={() => setSelecionado(null)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px", borderRadius: "12px", border: "1.5px solid",
                borderColor: selecionado === null ? "#7B00D4" : "#E5E7EB",
                background: selecionado === null ? "#F5F0FF" : "#fff",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                —
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>Sem atribuição</div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>Visível para toda a certificadora</div>
              </div>
            </button>

            {funcionarios.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelecionado(f.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px", borderRadius: "12px", border: "1.5px solid",
                  borderColor: selecionado === f.id ? "#7B00D4" : "#E5E7EB",
                  background: selecionado === f.id ? "#F5F0FF" : "#fff",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
              >
                <Avatar nome={f.nome} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}>{f.nome}</div>
                  {f.cargo && <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{f.cargo}</div>}
                </div>
                {!f.linkedUserId && (
                  <span style={{ fontSize: "10px", fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>
                    Sem conta
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid #E5E7EB", borderRadius: "12px", fontWeight: 600, cursor: "pointer", color: "#374151", fontSize: "14px" }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={salvando}
            style={{ flex: 2, padding: "12px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: salvando ? "not-allowed" : "pointer", fontSize: "14px", opacity: salvando ? 0.7 : 1 }}
          >
            {salvando ? "Salvando..." : "Confirmar atribuição"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendedorChatPage() {
  const router = useRouter();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [sessionRole, setSessionRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "nao_lidas">("todas");
  const [busca, setBusca] = useState("");
  const [funcionarios, setFuncionarios] = useState<FuncOpcao[]>([]);
  const [modalConversa, setModalConversa] = useState<Conversa | null>(null);

  const carregar = async () => {
    const res = await getMinhasConversas();
    if (res.success) {
      setConversas(res.conversas as any);
      setSessionRole((res as any).sessionRole ?? "");
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (sessionRole === "VENDEDOR") {
      listarFuncionariosParaAtribuicao().then((res) => {
        if (res.success) setFuncionarios(res.funcionarios as any);
      });
    }
  }, [sessionRole]);

  const lista = useMemo(() => {
    let resultado = filtro === "nao_lidas" ? conversas.filter((c) => c.naoLidas > 0) : conversas;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(
        (c) =>
          c.compradorNome.toLowerCase().includes(termo) ||
          c.isoTipo.toLowerCase().includes(termo) ||
          c.titulo.toLowerCase().includes(termo)
      );
    }
    return resultado;
  }, [conversas, filtro, busca]);

  const totalNaoLidas = conversas.reduce((acc, c) => acc + c.naoLidas, 0);

  const handleAtribuir = async (propostaId: number, funcionarioId: number | null) => {
    await atribuirFuncionarioAChat(propostaId, funcionarioId);
    await carregar();
  };

  const isVendedor = sessionRole === "VENDEDOR";

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>
              Conversas
              {totalNaoLidas > 0 && (
                <span style={{ marginLeft: "12px", background: "#EF4444", color: "#fff", fontSize: "14px", fontWeight: 800, padding: "3px 10px", borderRadius: "20px", verticalAlign: "middle" }}>
                  {totalNaoLidas}
                </span>
              )}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>
              {isVendedor ? "Todas as suas conversas com compradores" : "Conversas atribuídas a você"}
            </p>
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

        {/* Barra de busca */}
        <div style={{ position: "relative", maxWidth: "480px" }}>
          <svg
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)", pointerEvents: "none" }}
            xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou ISO (ex: Vanessa, ISO 9001...)"
            style={{
              width: "100%", padding: "11px 16px 11px 40px", borderRadius: "12px",
              border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.12)",
              color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box",
              backdropFilter: "blur(4px)", transition: "border-color 0.2s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.2)"; }}
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "16px", padding: "2px 6px", lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <VendedorSidebar role={sessionRole} />

        <div style={{ flex: 1, background: "#fff", borderRadius: "20px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", overflowY: "auto" }}>
          {loading ? (
            <p style={{ color: "#9CA3AF", textAlign: "center", padding: "60px 0" }}>Carregando conversas...</p>
          ) : lista.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>
                {busca ? "🔍" : "💬"}
              </div>
              <p style={{ color: "#374151", fontSize: "16px", fontWeight: 700, margin: "0 0 6px" }}>
                {busca
                  ? "Nenhum resultado encontrado"
                  : filtro === "nao_lidas"
                  ? "Nenhuma mensagem não lida"
                  : "Nenhuma conversa ainda"}
              </p>
              <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
                {busca
                  ? `Sem conversas com "${busca}"`
                  : filtro === "nao_lidas"
                  ? "Você está em dia com todas as conversas!"
                  : "As conversas aparecerão aqui quando houver propostas."}
              </p>
              {busca && (
                <button onClick={() => setBusca("")} style={{ marginTop: "16px", padding: "8px 20px", background: "none", border: "1.5px solid #E5E7EB", borderRadius: "10px", cursor: "pointer", color: "#6B7280", fontSize: "13px", fontWeight: 600 }}>
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div>
              {lista.map((c, i) => {
                const sc = STATUS_COLOR[c.status] ?? STATUS_COLOR.PENDENTE;
                return (
                  <div
                    key={c.id}
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 24px", borderTop: i > 0 ? "1px solid #F3F4F6" : "none", background: c.naoLidas > 0 ? "#FAFBFF" : "transparent" }}
                  >
                    {/* Avatar clicável */}
                    <div
                      onClick={() => router.push(`/chat/${c.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <Avatar nome={c.compradorNome} imagem={c.compradorImagem} size={46} />
                    </div>

                    {/* Info principal */}
                    <div
                      onClick={() => router.push(`/chat/${c.id}`)}
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ fontSize: "14px", fontWeight: c.naoLidas > 0 ? 800 : 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.compradorNome}
                        </span>
                        {c.isoTipo && (
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "8px", background: "#EDE9FE", color: "#6001D3", flexShrink: 0 }}>
                            {c.isoTipo}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.titulo}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {c.ultimaMensagem ? (
                          <span style={{ fontSize: "12px", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span style={{ fontWeight: 600 }}>{c.ultimaMensagem.remetente}:</span>{" "}
                            {c.ultimaMensagem.texto}
                          </span>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#D1D5DB", fontStyle: "italic" }}>Sem mensagens ainda</span>
                        )}
                        {/* Badge do funcionário responsável */}
                        {c.funcionario && (
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "8px", background: "#F0FDF4", color: "#166534", flexShrink: 0, whiteSpace: "nowrap" }}>
                            {c.funcionario.nome}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Coluna direita */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
                        {c.ultimaMensagem ? tempo(c.ultimaMensagem.createdAt) : ""}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: sc.bg, color: sc.text }}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                      {c.naoLidas > 0 && (
                        <span style={{ background: "#EF4444", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "20px", minWidth: "20px", textAlign: "center" }}>
                          {c.naoLidas}
                        </span>
                      )}
                      {/* Botão atribuir (apenas para vendedor) */}
                      {isVendedor && (
                        <button
                          onClick={() => setModalConversa(c)}
                          title="Atribuir funcionário"
                          style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            padding: "4px 10px", borderRadius: "8px",
                            border: "1.5px solid #E5E7EB", background: "#F9FAFB",
                            cursor: "pointer", fontSize: "11px", fontWeight: 600,
                            color: "#6B7280", transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7B00D4"; e.currentTarget.style.color = "#7B00D4"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#6B7280"; }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                          </svg>
                          {c.funcionario ? c.funcionario.nome : "Atribuir"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalConversa && (
        <ModalAtribuir
          conversa={modalConversa}
          funcionarios={funcionarios}
          onClose={() => setModalConversa(null)}
          onSave={handleAtribuir}
        />
      )}
    </div>
  );
}
