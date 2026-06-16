"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import {
  getSolicitacoes, aprovarVendedor, rejeitarVendedor,
  getNormasPendentes, aprovarListagem, rejeitarListagem,
} from "@/app/actions/admin";

type Solicitacao = {
  id: number; nome: string; cnpj: string | null; email: string; telefone: string;
  cidade: string; mensagem: string | null; isosVendidas: string;
  validadeCertificado: string | null; documentoComprovante: string | null;
  certificacoesISO: string | null;
  nomeContato: string | null; cargoContato: string | null;
  status: string; motivoRejeicao: string | null; createdAt: string;
};

type ListagemPendente = {
  id: number; isoTipo: string; titulo: string; descricao: string; cidade: string;
  imagem: string | null; destaque: string | null;
  status: string; createdAt: string;
  User: { id: string; name: string; email: string | null; razaoSocial: string | null; rankTier: string } | null;
};

type VendedorModalStep = "aprovacao" | "confirmado" | "motivo" | "recusado" | null;
type ListagemModalStep = "detalhe" | "confirmado" | "motivo" | "recusado" | null;

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px", padding: "36px 32px", width: "100%", maxWidth: "580px", boxShadow: "0 20px 60px rgba(80,0,160,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

const statusColor: Record<string, string> = { PENDENTE: "#F59E0B", APROVADO: "#22C55E", REJEITADO: "#EF4444" };
const statusLabel: Record<string, string> = { PENDENTE: "Pendente", APROVADO: "Aprovado", REJEITADO: "Rejeitado" };

export default function AprovacaoPage() {
  const [aba, setAba] = useState<"vendedores" | "normas">("vendedores");

  // Vendedores
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loadingVend, setLoadingVend] = useState(true);
  const [vendedorModal, setVendedorModal] = useState<VendedorModalStep>(null);
  const [selectedVendId, setSelectedVendId] = useState<number | null>(null);
  const [motivoVend, setMotivoVend] = useState("");
  const [motivoVendErro, setMotivoVendErro] = useState("");
  const [processandoVend, setProcessandoVend] = useState(false);

  // Normas
  const [normas, setNormas] = useState<ListagemPendente[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listagemModal, setListagemModal] = useState<ListagemModalStep>(null);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [motivoList, setMotivoList] = useState("");
  const [motivoListErro, setMotivoListErro] = useState("");
  const [processandoList, setProcessandoList] = useState(false);

  const carregarVendedores = async () => {
    setLoadingVend(true);
    const res = await getSolicitacoes();
    if (res.success) setSolicitacoes(res.solicitacoes as any);
    setLoadingVend(false);
  };

  const carregarNormas = async () => {
    setLoadingList(true);
    const res = await getNormasPendentes();
    if (res.success) setNormas(res.normas as any);
    setLoadingList(false);
  };

  useEffect(() => { carregarVendedores(); carregarNormas(); }, []);

  // ── Vendedor handlers ──
  const closeVend = () => { setVendedorModal(null); setSelectedVendId(null); setMotivoVend(""); setMotivoVendErro(""); };

  const handleAprovarVend = async () => {
    if (!selectedVendId) return;
    setProcessandoVend(true);
    await aprovarVendedor(selectedVendId);
    setProcessandoVend(false);
    setVendedorModal("confirmado");
    carregarVendedores();
  };

  const handleRejeitarVend = async () => {
    if (!motivoVend.trim()) { setMotivoVendErro("O motivo é obrigatório."); return; }
    if (!selectedVendId) return;
    setProcessandoVend(true);
    await rejeitarVendedor(selectedVendId, motivoVend);
    setProcessandoVend(false);
    setVendedorModal("recusado");
    carregarVendedores();
  };

  // ── Listagem handlers ──
  const closeList = () => { setListagemModal(null); setSelectedListId(null); setMotivoList(""); setMotivoListErro(""); };

  const handleAprovarList = async () => {
    if (!selectedListId) return;
    setProcessandoList(true);
    await aprovarListagem(selectedListId);
    setProcessandoList(false);
    setListagemModal("confirmado");
    carregarNormas();
  };

  const handleRejeitarList = async () => {
    if (!motivoList.trim()) { setMotivoListErro("O motivo é obrigatório."); return; }
    if (!selectedListId) return;
    setProcessandoList(true);
    await rejeitarListagem(selectedListId, motivoList);
    setProcessandoList(false);
    setListagemModal("recusado");
    carregarNormas();
  };

  const selectedSol = solicitacoes.find((s) => s.id === selectedVendId);
  const selectedList = normas.find((l) => l.id === selectedListId);

  const pendentesVend = solicitacoes.filter(s => s.status === "PENDENTE").length;
  const pendentesNormas = normas.length;

  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
        <h1 style={{ color: "#fff", fontSize: "42px", fontWeight: 700, marginBottom: "28px", marginTop: "8px", letterSpacing: "-0.5px", flexShrink: 0 }}>
          Aprovações
        </h1>

        <div style={{ display: "flex", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
          <Sidebar />

          <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "28px 32px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>

            {/* Abas */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "28px", background: "#F3F4F6", borderRadius: "12px", padding: "4px", flexShrink: 0 }}>
              {([
                { key: "vendedores", label: "Cadastros de Certificadoras", count: pendentesVend },
                { key: "normas", label: "Normas de ISO", count: pendentesNormas },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setAba(tab.key)}
                  style={{
                    flex: 1, padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    background: aba === tab.key ? "#fff" : "transparent",
                    color: aba === tab.key ? "#6001D3" : "#6B7280",
                    boxShadow: aba === tab.key ? "0 2px 8px rgba(80,0,160,0.12)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{ background: "#EF4444", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "2px 7px", borderRadius: "20px", lineHeight: 1.4 }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── ABA VENDEDORES ── */}
            {aba === "vendedores" && (
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
                  {[
                    { label: "Pendentes", value: solicitacoes.filter(s => s.status === "PENDENTE").length, color: "#F59E0B" },
                    { label: "Aprovados", value: solicitacoes.filter(s => s.status === "APROVADO").length, color: "#22C55E" },
                    { label: "Rejeitados", value: solicitacoes.filter(s => s.status === "REJEITADO").length, color: "#EF4444" },
                  ].map((c) => (
                    <div key={c.label} style={{ borderLeft: `4px solid ${c.color}`, borderRadius: "12px", padding: "10px 18px", minWidth: "100px", boxShadow: "3px 5px 4px rgba(80,0,160,0.2)" }}>
                      <div style={{ fontSize: "26px", fontWeight: 900, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize: "11px", color: c.color, fontWeight: 600 }}>{c.label}</div>
                    </div>
                  ))}
                </div>

                {loadingVend ? (
                  <p style={{ color: "#888", padding: "40px 0", textAlign: "center" }}>Carregando...</p>
                ) : solicitacoes.length === 0 ? (
                  <p style={{ color: "#aaa", padding: "40px 0", textAlign: "center" }}>Nenhuma solicitação encontrada.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {solicitacoes.map((sol, i) => (
                      <div key={sol.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 0", borderTop: i > 0 ? "1px solid #f0f0f0" : "none" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#EDE9FE", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#6001D3", fontSize: "15px" }}>
                          {sol.nome[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#111" }}>{sol.nome}</div>
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {sol.cnpj && <span>{sol.cnpj} · </span>}
                            {sol.email} · {sol.cidade}
                          </div>
                          {sol.nomeContato && (
                            <div style={{ fontSize: "12px", color: "#6001D3", marginTop: "2px" }}>
                              👤 {sol.nomeContato}{sol.cargoContato ? ` — ${sol.cargoContato}` : ""}
                            </div>
                          )}
                          {sol.validadeCertificado && (
                            <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                              Cert. válido até: {new Date(sol.validadeCertificado + "T12:00:00").toLocaleDateString("pt-BR")}
                            </div>
                          )}
                          {sol.isosVendidas && (
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                              {sol.isosVendidas.split(",").map((iso) => (
                                <span key={iso} style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "8px" }}>
                                  {iso.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ background: (statusColor[sol.status] || "#ccc") + "22", color: statusColor[sol.status] || "#ccc", fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px" }}>
                            {statusLabel[sol.status] || sol.status}
                          </span>
                          {sol.status === "PENDENTE" && (
                            <button
                              onClick={() => { setSelectedVendId(sol.id); setVendedorModal("aprovacao"); }}
                              style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid #6001D3", color: "#6001D3", fontWeight: 700, fontSize: "13px", background: "transparent", cursor: "pointer" }}
                            >
                              Analisar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ABA NORMAS ── */}
            {aba === "normas" && (
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                    Cada nova listagem criada por certificadoras precisa ser revisada antes de aparecer para compradores.
                  </p>
                </div>

                {loadingList ? (
                  <p style={{ color: "#888", padding: "40px 0", textAlign: "center" }}>Carregando...</p>
                ) : normas.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                    <p style={{ color: "#6B7280", fontSize: "15px", fontWeight: 600 }}>Nenhuma listagem aguardando aprovação.</p>
                    <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "4px" }}>Tudo em dia por aqui!</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {normas.map((l) => (
                      <div
                        key={l.id}
                        style={{ border: "1.5px solid #E5E7EB", borderRadius: "16px", padding: "20px 24px", display: "flex", gap: "16px", alignItems: "flex-start" }}
                      >
                        {/* Imagem ou placeholder */}
                        <div style={{ width: "72px", height: "72px", borderRadius: "12px", background: "#F3F4F6", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {l.imagem ? (
                            <img src={l.imagem} alt={l.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: "28px" }}>📋</span>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* ISO badge + data */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                            <span style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px" }}>
                              {l.isoTipo}
                            </span>
                            <span style={{ fontSize: "11px", color: "#9CA3AF" }}>
                              Enviada em {new Date(l.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>

                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#111", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.titulo}
                          </div>

                          <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                            {l.descricao}
                          </div>

                          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#888", flexWrap: "wrap" }}>
                            <span>📍 {l.cidade}</span>
                          </div>

                          {/* Vendedor */}
                          {l.User && (
                            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#6001D3" }}>
                                {l.User.name[0]}
                              </div>
                              <span style={{ fontSize: "12px", color: "#374151", fontWeight: 600 }}>{l.User.razaoSocial || l.User.name}</span>
                              {l.User.email && <span style={{ fontSize: "11px", color: "#9CA3AF" }}>· {l.User.email}</span>}
                            </div>
                          )}
                        </div>

                        <div style={{ flexShrink: 0 }}>
                          <button
                            onClick={() => { setSelectedListId(l.id); setListagemModal("detalhe"); }}
                            style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid #6001D3", color: "#6001D3", fontWeight: 700, fontSize: "13px", background: "transparent", cursor: "pointer" }}
                          >
                            Revisar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ MODAIS VENDEDOR ══════════ */}

      {vendedorModal === "aprovacao" && selectedSol && (
        <Overlay onClose={closeVend}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginTop: 0, marginBottom: "20px", color: "#111" }}>Analisar Solicitação</h2>
          <div style={{ background: "#F9FAFB", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Empresa</p>
            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "16px", color: "#111" }}>🏢 {selectedSol.nome}</p>
            {selectedSol.cnpj && <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#666" }}>🪪 CNPJ: {selectedSol.cnpj}</p>}
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#666" }}>📧 {selectedSol.email}</p>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#666" }}>📞 {selectedSol.telefone}</p>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#666" }}>📍 {selectedSol.cidade}</p>
            {selectedSol.validadeCertificado && (
              <p style={{ margin: "8px 0 0", fontSize: "13px" }}>
                📅 Validade do certificado:{" "}
                <strong style={{ color: "#6001D3" }}>
                  {new Date(selectedSol.validadeCertificado + "T12:00:00").toLocaleDateString("pt-BR")}
                </strong>
              </p>
            )}
          </div>
          {(selectedSol.nomeContato || selectedSol.cargoContato) && (
            <div style={{ background: "#F0F9FF", borderRadius: "14px", padding: "16px 20px", marginBottom: "16px", border: "1px solid #BAE6FD" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contato Principal</p>
              {selectedSol.nomeContato && <p style={{ margin: "4px 0 2px", fontWeight: 600, fontSize: "14px", color: "#111" }}>👤 {selectedSol.nomeContato}</p>}
              {selectedSol.cargoContato && <p style={{ margin: "0", fontSize: "13px", color: "#666" }}>{selectedSol.cargoContato}</p>}
            </div>
          )}
          {selectedSol.mensagem && (
            <div style={{ background: "#FFFBEB", borderRadius: "12px", padding: "14px", marginBottom: "16px", border: "1px solid #FDE68A" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>Mensagem</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#555", fontStyle: "italic" }}>"{selectedSol.mensagem}"</p>
            </div>
          )}
          {/* Certificações por ISO (novo formato) */}
          {selectedSol.certificacoesISO ? (() => {
            let certs: { iso: string; validade: string; documento: string }[] = [];
            try { certs = JSON.parse(selectedSol.certificacoesISO); } catch { /* ignora */ }
            return certs.length > 0 ? (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginTop: 0, marginBottom: "12px" }}>📋 Certificações por ISO:</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {certs.map((cert) => (
                    <div key={cert.iso} style={{ border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                        <span style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "13px", fontWeight: 700, padding: "4px 12px", borderRadius: "8px" }}>{cert.iso}</span>
                        {cert.validade && (
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>
                            Válido até: <strong style={{ color: "#374151" }}>{new Date(cert.validade + "T12:00:00").toLocaleDateString("pt-BR")}</strong>
                          </span>
                        )}
                      </div>
                      {cert.documento && (
                        <div style={{ marginTop: "8px" }}>
                          <a href={cert.documento} target="_blank" rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#F0F9FF", border: "1px solid #BAE6FD", padding: "6px 14px", borderRadius: "8px", color: "#0369A1", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
                            📎 Ver comprovante
                          </a>
                          {cert.documento.match(/\.(png|jpg|jpeg|webp)$/i) && (
                            <div style={{ marginTop: "8px", borderRadius: "8px", overflow: "hidden", border: "1px solid #E5E7EB" }}>
                              <img src={cert.documento} alt={`Comprovante ${cert.iso}`} style={{ width: "100%", maxHeight: "200px", objectFit: "contain" }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })() : (
            /* Formato antigo: ISO badges + documento único */
            <>
              {selectedSol.isosVendidas && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginTop: 0, marginBottom: "10px" }}>📋 ISOs que pretende vender:</h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {selectedSol.isosVendidas.split(",").map((iso) => (
                      <span key={iso} style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "13px", fontWeight: 700, padding: "6px 14px", borderRadius: "10px" }}>{iso.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedSol.documentoComprovante && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginTop: 0, marginBottom: "10px" }}>📄 Documento comprovante:</h3>
                  <a href={selectedSol.documentoComprovante} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#F0F9FF", border: "1.5px solid #BAE6FD", padding: "10px 18px", borderRadius: "10px", color: "#0369A1", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                    📎 Visualizar / Download
                  </a>
                  {selectedSol.documentoComprovante.match(/\.(png|jpg|jpeg|webp)$/i) && (
                    <div style={{ marginTop: "12px", borderRadius: "10px", overflow: "hidden", border: "1px solid #E5E7EB" }}>
                      <img src={selectedSol.documentoComprovante} alt="Comprovante" style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={handleAprovarVend} disabled={processandoVend} style={{ padding: "14px", background: "linear-gradient(90deg,#22C55E,#16A34A)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
              ✅ Aprovar Certificadora
            </button>
            <button onClick={() => setVendedorModal("motivo")} style={{ padding: "14px", background: "transparent", color: "#EF4444", border: "1.5px solid #EF4444", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
              ✕ Rejeitar
            </button>
          </div>
        </Overlay>
      )}

      {vendedorModal === "motivo" && (
        <Overlay onClose={closeVend}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginTop: 0, marginBottom: "16px", color: "#111" }}>Motivo da Rejeição</h2>
          <p style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>Informe o motivo da rejeição. Este campo é obrigatório.</p>
          <textarea value={motivoVend} onChange={(e) => setMotivoVend(e.target.value)} rows={4} placeholder="Descreva o motivo..."
            style={{ width: "100%", border: `1.5px solid ${motivoVendErro ? "#EF4444" : "#7B00D4"}`, borderRadius: "12px", padding: "12px 14px", fontSize: "14px", resize: "none", boxSizing: "border-box", marginBottom: "8px" }} />
          {motivoVendErro && <p style={{ color: "#EF4444", fontSize: "13px", margin: "0 0 16px" }}>{motivoVendErro}</p>}
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button onClick={() => setVendedorModal("aprovacao")} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid #ccc", borderRadius: "12px", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button onClick={handleRejeitarVend} disabled={processandoVend} style={{ flex: 1, padding: "12px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Confirmar Rejeição</button>
          </div>
        </Overlay>
      )}

      {vendedorModal === "confirmado" && (
        <Overlay onClose={closeVend}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111", marginBottom: "12px" }}>Certificadora Aprovada!</h2>
            <p style={{ color: "#666", marginBottom: "28px" }}>A certificadora receberá as credenciais de acesso e já poderá criar suas normas.</p>
            <button onClick={closeVend} style={{ padding: "12px 32px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Fechar</button>
          </div>
        </Overlay>
      )}

      {vendedorModal === "recusado" && (
        <Overlay onClose={closeVend}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>❌</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111", marginBottom: "12px" }}>Solicitação Rejeitada</h2>
            <p style={{ color: "#666", marginBottom: "28px" }}>O registro da rejeição foi salvo com o motivo informado.</p>
            <button onClick={closeVend} style={{ padding: "12px 32px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Fechar</button>
          </div>
        </Overlay>
      )}

      {/* ══════════ MODAIS LISTAGEM ══════════ */}

      {listagemModal === "detalhe" && selectedList && (
        <Overlay onClose={closeList}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginTop: 0, marginBottom: "20px", color: "#111" }}>Revisar Listagem</h2>

          {/* Vendedor */}
          {selectedList.User && (
            <div style={{ background: "#F0F9FF", borderRadius: "14px", padding: "14px 18px", marginBottom: "16px", border: "1px solid #BAE6FD" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#0284C7", textTransform: "uppercase", letterSpacing: "0.5px" }}>Certificadora</p>
              <p style={{ margin: "4px 0 2px", fontWeight: 700, fontSize: "15px", color: "#111" }}>
                🏢 {selectedList.User.razaoSocial || selectedList.User.name}
              </p>
              {selectedList.User.email && (
                <p style={{ margin: 0, fontSize: "12px", color: "#0369A1" }}>📧 {selectedList.User.email}</p>
              )}
            </div>
          )}

          {/* ISO + Título */}
          <div style={{ background: "#F9FAFB", borderRadius: "14px", padding: "18px 20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ background: "#EDE9FE", color: "#6001D3", fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px" }}>
                {selectedList.isoTipo}
              </span>
              {selectedList.destaque && (
                <span style={{ background: "#DCFCE7", color: "#16A34A", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px" }}>
                  {selectedList.destaque}
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: "17px", color: "#111" }}>{selectedList.titulo}</p>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#555", lineHeight: 1.6 }}>{selectedList.descricao}</p>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "13px" }}>
              <span style={{ color: "#6B7280" }}>📍 {selectedList.cidade}</span>
            </div>
          </div>

          {/* Imagem */}
          {selectedList.imagem && (
            <div style={{ marginBottom: "20px", borderRadius: "12px", overflow: "hidden", border: "1px solid #E5E7EB" }}>
              <img src={selectedList.imagem} alt={selectedList.titulo} style={{ width: "100%", maxHeight: "220px", objectFit: "cover" }} />
            </div>
          )}

          <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "16px", marginBottom: "16px" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>
              Enviada em {new Date(selectedList.createdAt).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={handleAprovarList} disabled={processandoList} style={{ padding: "14px", background: "linear-gradient(90deg,#22C55E,#16A34A)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
              ✅ Aprovar Listagem
            </button>
            <button onClick={() => setListagemModal("motivo")} style={{ padding: "14px", background: "transparent", color: "#EF4444", border: "1.5px solid #EF4444", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
              ✕ Rejeitar Listagem
            </button>
          </div>
        </Overlay>
      )}

      {listagemModal === "motivo" && (
        <Overlay onClose={closeList}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginTop: 0, marginBottom: "8px", color: "#111" }}>Rejeitar Listagem</h2>
          <p style={{ color: "#888", marginBottom: "6px", fontSize: "14px" }}>
            Informe o motivo para rejeição de <strong>"{selectedList?.titulo}"</strong>.
          </p>
          <p style={{ color: "#9CA3AF", marginBottom: "16px", fontSize: "12px" }}>
            A certificadora será notificada com este motivo para que possa corrigir e reenviar.
          </p>
          <textarea
            value={motivoList}
            onChange={(e) => setMotivoList(e.target.value)}
            rows={4}
            placeholder="Ex: Descrição muito genérica, preço fora do padrão, imagem inapropriada..."
            style={{ width: "100%", border: `1.5px solid ${motivoListErro ? "#EF4444" : "#7B00D4"}`, borderRadius: "12px", padding: "12px 14px", fontSize: "14px", resize: "none", boxSizing: "border-box", marginBottom: "8px" }}
          />
          {motivoListErro && <p style={{ color: "#EF4444", fontSize: "13px", margin: "0 0 16px" }}>{motivoListErro}</p>}
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button onClick={() => setListagemModal("detalhe")} style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid #ccc", borderRadius: "12px", fontWeight: 600, cursor: "pointer" }}>Voltar</button>
            <button onClick={handleRejeitarList} disabled={processandoList} style={{ flex: 1, padding: "12px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Confirmar Rejeição</button>
          </div>
        </Overlay>
      )}

      {listagemModal === "confirmado" && (
        <Overlay onClose={closeList}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111", marginBottom: "12px" }}>Listagem Aprovada!</h2>
            <p style={{ color: "#666", marginBottom: "28px" }}>A listagem já está visível para compradores. A certificadora foi notificada.</p>
            <button onClick={closeList} style={{ padding: "12px 32px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Fechar</button>
          </div>
        </Overlay>
      )}

      {listagemModal === "recusado" && (
        <Overlay onClose={closeList}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>❌</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#111", marginBottom: "12px" }}>Listagem Rejeitada</h2>
            <p style={{ color: "#666", marginBottom: "28px" }}>A certificadora foi notificada com o motivo informado e poderá corrigir a listagem.</p>
            <button onClick={closeList} style={{ padding: "12px 32px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>Fechar</button>
          </div>
        </Overlay>
      )}
    </>
  );
}
