"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";
import { getPropostasVendedor, enviarPropostaVendedor, cancelarProposta, confirmarNegociacao } from "@/app/actions/negociacao";
import { getSession } from "@/app/actions/auth";

type PropostaVendedor = {
  id: number; solicitante: string; servico: string; status: string;
  documentoProposta: string | null; motivoRecusa: string | null; createdAt: Date | string;
  vendedorConfirmou: boolean; compradorConfirmou: boolean;
  Comprador: { name: string; email: string | null } | null;
  Listagem: { isoTipo: string; titulo: string } | null;
  _count: { mensagens: number };
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  CONTATO_SOLICITADO: { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", label: "Contato Solicitado" },
  EM_CONTATO:         { bg: "rgba(0, 169, 214, 0.15)", text: "#00A9D6", label: "Em Contato" },
  PROPOSTA_ENVIADA:   { bg: "rgba(0, 235, 203, 0.15)", text: "#00EBCB", label: "Proposta Enviada" },
  PROPOSTA_RECUSADA:  { bg: "rgba(239, 68, 68, 0.15)", text: "#F87171", label: "Proposta Recusada" },
  EM_NEGOCIACAO:      { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", label: "Em Negociação" },
  PROPOSTA_FECHADA:   { bg: "rgba(34, 197, 94, 0.15)", text: "#22C55E", label: "Proposta Fechada" },
  CANCELADA:          { bg: "rgba(239, 68, 68, 0.15)", text: "#F87171", label: "Cancelada" },
};

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,13,29,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "500px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto", color: "#FFFFFF" }}>
        {children}
      </div>
    </div>
  );
}

export default function VendedorPropostasPage() {
  const router = useRouter();
  const [propostas, setPropostas] = useState<PropostaVendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Awaited<ReturnType<typeof getSession>>>(null);
  const [detalhes, setDetalhes] = useState<PropostaVendedor | null>(null);
  const [envioModal, setEnvioModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const firstName = user?.name ? user.name.split(" ")[0] : "Certificadora";

  const carregar = () => getPropostasVendedor().then((res) => {
    if (res.success && res.propostas) setPropostas(res.propostas);
    setLoading(false);
  });

  useEffect(() => {
    getSession().then(setUser);
    carregar();
  }, []);

  const handleEnviarProposta = async () => {
    setErro("");
    if (!uploadFile || !detalhes) { setErro("Selecione um arquivo para enviar."); return; }
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) { setErro(uploadData.error || "Erro no upload."); setEnviando(false); return; }
      const res = await enviarPropostaVendedor(detalhes.id, uploadData.url);
      if (!res.success) { setErro(res.error || "Erro ao enviar proposta."); setEnviando(false); return; }
      setEnvioModal(false);
      setUploadFile(null);
      setDetalhes(null);
      carregar();
    } catch {
      setErro("Erro ao processar.");
    }
    setEnviando(false);
  };

  const handleConfirmar = async (id: number) => {
    setLoadingAcao(true);
    await confirmarNegociacao(id);
    setLoadingAcao(false);
    setDetalhes(null);
    carregar();
  };

  const handleCancelar = async (id: number) => {
    if (!confirm("Deseja cancelar esta proposta?")) return;
    setLoadingAcao(true);
    await cancelarProposta(id);
    setLoadingAcao(false);
    setDetalhes(null);
    carregar();
  };

  const ativas  = propostas.filter((p) => !["PROPOSTA_FECHADA", "CANCELADA"].includes(p.status));
  const fechadas = propostas.filter((p) => p.status === "PROPOSTA_FECHADA");
  const propostasFiltradas = propostas.filter((p) => {
    const q = busca.toLowerCase();
    const textoOk = !busca || [p.Comprador?.name, p.solicitante, p.Listagem?.isoTipo, p.Listagem?.titulo].join(" ").toLowerCase().includes(q);
    return textoOk && (filtroStatus === "TODOS" || p.status === filtroStatus);
  });

  return (
    <>
      <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column", fontFamily: "var(--font-montserrat), sans-serif" }}>
        <h1 style={{ color: "#FFFFFF", fontSize: "32px", fontWeight: 800, marginBottom: "32px", marginTop: "8px", letterSpacing: "-0.5px", flexShrink: 0 }}>
          Olá, {firstName}
        </h1>

        <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
          <VendedorSidebar />

          <div style={{ flex: 1, background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "36px 48px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", height: "100%", overflowY: "auto", color: "#FFFFFF" }}>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px" }}>Minhas Propostas</h2>
            <p style={{ fontSize: "13px", color: "#A7B0B8", margin: "0 0 32px", fontWeight: 400 }}>
              Gerencie as solicitações de contato e envie suas propostas comerciais.
            </p>

            <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
              {[
                { label: "Ativas",  value: ativas.length,   color: "#F59E0B" },
                { label: "Fechadas", value: fechadas.length, color: "#22C55E" },
                { label: "Total",   value: propostas.length, color: "#00EBCB" },
              ].map((c) => (
                <div key={c.label} style={{ background: "#020D1D", borderLeft: `4px solid ${c.color}`, border: "1px solid rgba(232, 237, 240, 0.1)", borderLeftColor: c.color, borderRadius: "12px", padding: "10px 18px", minWidth: "90px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: "11px", color: c.color, fontWeight: 600 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {loading ? (
              <p style={{ color: "#888", textAlign: "center", paddingTop: "40px" }}>Carregando...</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  <input
                    type="text"
                    placeholder="Buscar por cliente, norma ou serviço..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="placeholder:text-[#A7B0B8]"
                    style={{ padding: "12px 16px", borderRadius: "10px", border: "1.5px solid rgba(232, 237, 240, 0.18)", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box", color: "#FFFFFF", caretColor: "#FFFFFF", background: "#020D1D" }}
                  />
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[{ key: "TODOS", label: "Todos" }, ...Object.entries(statusConfig).map(([k, v]) => ({ key: k, label: v.label }))].map((s) => (
                      <button key={s.key} onClick={() => setFiltroStatus(s.key)}
                        style={{ padding: "6px 16px", borderRadius: "20px", border: "1.5px solid", borderColor: filtroStatus === s.key ? "#00EBCB" : "rgba(232, 237, 240, 0.15)", background: filtroStatus === s.key ? "#00EBCB" : "transparent", color: filtroStatus === s.key ? "#020D1D" : "#A7B0B8", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {propostas.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ fontSize: "56px", marginBottom: "16px" }}>📋</div>
                    <p style={{ color: "#A7B0B8", fontSize: "16px", fontWeight: 400 }}>Nenhuma proposta recebida ainda.</p>
                  </div>
                ) : propostasFiltradas.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#A7B0B8", fontSize: "14px", padding: "32px 0" }}>Nenhum resultado para esta busca.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {propostasFiltradas.map((p) => {
                      const cfg = statusConfig[p.status] ?? { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", label: "Pendente" };
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", border: "1.5px solid rgba(232, 237, 240, 0.12)", background: "#020D1D", borderRadius: "16px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(0, 235, 203, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#00EBCB", fontSize: "13px", flexShrink: 0 }}>
                                {(p.Comprador?.name || p.solicitante)[0]}
                              </div>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.Comprador?.name || p.solicitante}
                              </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#00A9D6", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.Listagem?.isoTipo || ""}{p.Listagem?.titulo ? ` — ${p.Listagem.titulo}` : ""}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "16px", flexShrink: 0 }}>
                            <span style={{ background: cfg.bg, color: cfg.text, fontSize: "11px", fontWeight: 700, padding: "5px 12px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                              {cfg.label}
                            </span>
                            {["CONTATO_SOLICITADO", "EM_CONTATO", "PROPOSTA_RECUSADA"].includes(p.status) && (
                              <button onClick={() => { setDetalhes(p); setErro(""); setUploadFile(null); setEnvioModal(true); }}
                                style={{ padding: "8px 16px", borderRadius: "8px", background: "#00EBCB", color: "#020D1D", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,235,203,0.3)" }}>
                                📎 Enviar Proposta
                              </button>
                            )}
                            <button onClick={() => { setDetalhes(p); setErro(""); setUploadFile(null); }}
                              style={{ position: "relative", padding: "8px 16px", borderRadius: "8px", background: "rgba(232, 237, 240, 0.08)", color: "#E8EDF0", border: "1.5px solid rgba(232, 237, 240, 0.18)", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
                              Detalhes
                              {p._count.mensagens > 0 && (
                                <span style={{ position: "absolute", top: "-6px", right: "-6px", minWidth: "18px", height: "18px", borderRadius: "50%", background: "#EF4444", color: "#fff", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", boxShadow: "0 2px 6px rgba(239,68,68,0.5)" }}>
                                  {p._count.mensagens > 9 ? "9+" : p._count.mensagens}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {detalhes && !envioModal && (() => {
        const cfg = statusConfig[detalhes.status] ?? { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", label: "Pendente" };
        const finalizado = ["PROPOSTA_FECHADA", "CANCELADA"].includes(detalhes.status);
        const podeEnviar = ["CONTATO_SOLICITADO", "EM_CONTATO", "PROPOSTA_RECUSADA"].includes(detalhes.status);
        const podeConfirmar = !finalizado && !detalhes.vendedorConfirmou &&
          ["PROPOSTA_ENVIADA", "EM_NEGOCIACAO"].includes(detalhes.status);
        const podeCancelar = !["PROPOSTA_FECHADA", "CANCELADA", "EM_NEGOCIACAO", "PROPOSTA_ENVIADA"].includes(detalhes.status);
        return (
          <Modal onClose={() => setDetalhes(null)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#A7B0B8", fontWeight: 600 }}>PROPOSTA #{detalhes.id}</p>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#FFFFFF" }}>
                  {detalhes.Comprador?.name || detalhes.solicitante}
                </h2>
              </div>
              <span style={{ background: cfg.bg, color: cfg.text, fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", flexShrink: 0, marginLeft: "12px" }}>
                {cfg.label}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {detalhes.Comprador?.email && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#A7B0B8" }}>E-mail</span>
                  <span style={{ fontWeight: 600, color: "#FFFFFF" }}>{detalhes.Comprador.email}</span>
                </div>
              )}
              {detalhes.Listagem?.isoTipo && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#A7B0B8" }}>Norma</span>
                  <span style={{ fontWeight: 700, color: "#00EBCB" }}>{detalhes.Listagem.isoTipo}</span>
                </div>
              )}
              {detalhes.Listagem?.titulo && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#A7B0B8" }}>Serviço</span>
                  <span style={{ fontWeight: 600, color: "#FFFFFF", textAlign: "right", maxWidth: "60%" }}>{detalhes.Listagem.titulo}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#A7B0B8" }}>Data</span>
                <span style={{ fontWeight: 600, color: "#FFFFFF" }}>
                  {new Date(detalhes.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {detalhes.compradorConfirmou && (
                <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#22C55E", fontWeight: 600 }}>
                  ✅ O comprador já confirmou o encerramento
                </div>
              )}
            </div>

            {detalhes.status === "PROPOSTA_RECUSADA" && detalhes.motivoRecusa && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1.5px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 800, color: "#F87171", letterSpacing: "0.5px" }}>MOTIVO DA RECUSA PELO COMPRADOR</p>
                <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#E8EDF0", lineHeight: 1.6 }}>{detalhes.motivoRecusa}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#F87171", fontWeight: 600 }}>
                  📎 Revise as mudanças solicitadas e envie uma nova proposta abaixo.
                </p>
              </div>
            )}

            {detalhes.documentoProposta && (
              <button onClick={() => window.open(detalhes.documentoProposta!, "_blank")}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0, 169, 214, 0.1)", border: "1.5px solid rgba(0, 169, 214, 0.25)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "#00EBCB", cursor: "pointer", width: "100%", marginBottom: "16px" }}>
                {detalhes.status === "PROPOSTA_RECUSADA" ? "📄 Ver proposta anterior" : "📄 Ver proposta enviada"}
              </button>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => { setDetalhes(null); router.push(`/chat/${detalhes.id}`); }}
                style={{ position: "relative", width: "100%", padding: "13px", borderRadius: "10px", background: "rgba(0, 235, 203, 0.12)", color: "#00EBCB", border: "1.5px solid rgba(0, 235, 203, 0.25)", fontWeight: 600, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                💬 Abrir Chat
                {detalhes._count.mensagens > 0 && (
                  <span style={{ marginLeft: "4px", minWidth: "20px", height: "20px", borderRadius: "10px", background: "#EF4444", color: "#fff", fontSize: "11px", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                    {detalhes._count.mensagens > 9 ? "9+" : detalhes._count.mensagens}
                  </span>
                )}
              </button>

              {podeEnviar && (
                <button onClick={() => { setEnvioModal(true); setErro(""); setUploadFile(null); }}
                  style={{ width: "100%", padding: "13px", borderRadius: "10px", background: "#00EBCB", color: "#020D1D", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}>
                  📎 Enviar Proposta
                </button>
              )}

              {podeConfirmar && (
                <button onClick={() => handleConfirmar(detalhes.id)} disabled={loadingAcao}
                  style={{ width: "100%", padding: "13px", borderRadius: "10px", background: "#22C55E", color: "#020D1D", border: "none", fontWeight: 600, fontSize: "14px", cursor: "pointer", opacity: loadingAcao ? 0.7 : 1 }}>
                  ✅ Confirmar Encerramento
                </button>
              )}

              {podeCancelar && (
                <button onClick={() => handleCancelar(detalhes.id)} disabled={loadingAcao}
                  style={{ width: "100%", padding: "13px", borderRadius: "10px", background: "transparent", color: "#EF4444", border: "1.5px solid #EF4444", fontWeight: 600, fontSize: "14px", cursor: "pointer", opacity: loadingAcao ? 0.7 : 1 }}>
                  ✕ Cancelar Proposta
                </button>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* Modal de Envio de Proposta */}
      {detalhes && envioModal && (
        <Modal onClose={() => { setEnvioModal(false); setUploadFile(null); setErro(""); }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📎</div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", marginTop: 0, marginBottom: "12px" }}>Enviar Proposta</h2>
            <p style={{ color: "#A7B0B8", marginBottom: "24px", lineHeight: 1.6, fontSize: "14px" }}>
              Anexe o arquivo da sua proposta comercial. O comprador receberá uma notificação.
            </p>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px 20px", border: "2px dashed rgba(0,235,203,0.3)", borderRadius: "12px", cursor: "pointer", marginBottom: "8px", background: uploadFile ? "rgba(0, 235, 203, 0.1)" : "#020D1D", color: uploadFile ? "#00EBCB" : "#A7B0B8", fontWeight: 600, fontSize: "14px", transition: "all 0.2s" }}>
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }} />
              {uploadFile ? `✓ ${uploadFile.name.slice(0, 30)}` : "Selecionar arquivo (PDF, DOC, imagem)"}
            </label>
            {erro && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "10px", color: "#F87171", fontSize: "13px", marginBottom: "16px" }}>{erro}</div>
            )}
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button onClick={() => { setEnvioModal(false); setUploadFile(null); setErro(""); }}
                style={{ flex: 1, padding: "14px", background: "transparent", border: "1.5px solid rgba(232, 237, 240, 0.2)", color: "#E8EDF0", borderRadius: "12px", fontWeight: 600, cursor: "pointer" }}>
                Voltar
              </button>
              <button onClick={handleEnviarProposta} disabled={enviando || !uploadFile}
                style={{ flex: 1, padding: "14px", background: uploadFile ? "#00EBCB" : "rgba(232, 237, 240, 0.1)", color: uploadFile ? "#020D1D" : "#A7B0B8", border: "none", borderRadius: "12px", fontWeight: 600, cursor: uploadFile ? "pointer" : "not-allowed", boxShadow: uploadFile ? "0 4px 14px rgba(0,235,203,0.3)" : "none" }}>
                {enviando ? "Enviando..." : "📎 Enviar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
