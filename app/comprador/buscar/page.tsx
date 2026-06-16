"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { consultarServicos } from "@/app/actions/servicos";
import { ISOS_DISPONIVEIS, TIPOS_SERVICO, CATEGORIAS_SERVICO, ESTADOS_CIDADES } from "@/app/lib/estados";
import CompradorSidebar from "@/app/components/layout/CompradorSidebar";

type Servico = {
  id: number; isoTipo: string; titulo: string; descricao: string; cidade: string;
  destaque: string | null; imagem: string | null;
  User: { name: string; rankScore?: number; rankTier?: string } | null;
};

type Step = 1 | 2 | 3 | 4 | 5 | "loading" | "results";

const RANK_BADGE: Record<string, { icon: string; label: string; bg: string; text: string; border: string }> = {
  PRATA:   { icon: "🥈", label: "Prata",   bg: "#F3F4F6", text: "#4B5563", border: "#9E9E9E" },
  OURO:    { icon: "🥇", label: "Ouro",    bg: "#FFFBEB", text: "#92400E", border: "#FFD700" },
  PLATINA: { icon: "💎", label: "Platina", bg: "#F5F3FF", text: "#6001D3", border: "#A855F7" },
};

const btnBackStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
  color: "#fff", borderRadius: "10px", padding: "6px 14px",
  fontWeight: 600, fontSize: "13px", cursor: "pointer",
};

const btnPrimaryStyle: React.CSSProperties = {
  background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff",
  border: "none", borderRadius: "12px", padding: "14px 36px",
  fontWeight: 800, fontSize: "15px", cursor: "pointer",
};

const cardBaseStyle: React.CSSProperties = {
  background: "#fff", border: "2px solid transparent", borderRadius: "16px",
  cursor: "pointer", textAlign: "left",
  boxShadow: "0 4px 16px rgba(0,0,0,0.12)", transition: "all 0.15s",
};

const cardSelectedStyle: React.CSSProperties = {
  ...cardBaseStyle, border: "2px solid #6001D3", background: "#F5F3FF",
};

export default function CompradorBuscarPage() {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [tipoServico, setTipoServico] = useState("");
  const [categoriaServico, setCategoriaServico] = useState("");
  const [normasSelecionadas, setNormasSelecionadas] = useState<string[]>([]);
  const [estadosSelecionados, setEstadosSelecionados] = useState<string[]>([]);
  const [cidadesSelecionadas, setCidadesSelecionadas] = useState<string[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);

  const estados = Object.keys(ESTADOS_CIDADES).sort();
  const cidadesDisponiveis = estadosSelecionados
    .flatMap((est) => ESTADOS_CIDADES[est] ?? [])
    .sort();

  const scrollCarousel = (dir: "left" | "right") => {
    carouselRef.current?.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  };

  const toggleNorma = (n: string) =>
    setNormasSelecionadas((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const toggleEstado = (est: string) => {
    setEstadosSelecionados((prev) => {
      const next = prev.includes(est) ? prev.filter((x) => x !== est) : [...prev, est];
      const cidadesValidas = next.flatMap((e) => ESTADOS_CIDADES[e] ?? []);
      setCidadesSelecionadas((c) => c.filter((cidade) => cidadesValidas.includes(cidade)));
      return next;
    });
  };

  const toggleCidade = (c: string) =>
    setCidadesSelecionadas((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const buscar = async () => {
    setStep("loading");
    const res = await consultarServicos({ tipoServico, categoriaServico, normas: normasSelecionadas, cidades: cidadesSelecionadas });
    if (res.success) setServicos(res.servicos as Servico[]);
    setStep("results");
  };

  const reset = () => {
    setStep(1); setTipoServico(""); setCategoriaServico("");
    setNormasSelecionadas([]); setEstadosSelecionados([]);
    setCidadesSelecionadas([]); setServicos([]);
  };

  const breadcrumb = [tipoServico, categoriaServico].filter(Boolean).join(" › ");

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>
          Buscar Serviço
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>
          Encontre o fornecedor ideal para sua necessidade
        </p>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <CompradorSidebar />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {step !== "results" ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
              <div style={{ width: "100%", maxWidth: "800px" }}>

                {/* ── Tela 1: Tipo de Serviço ── */}
                {step === 1 && (
                  <div className="animate-fade-in">
                    <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#fff", marginBottom: "28px", lineHeight: 1.2 }}>
                      Qual tipo de serviço você precisa?
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                      {TIPOS_SERVICO.map((t) => (
                        <button key={t.label}
                          onClick={() => { setTipoServico(t.label); setCategoriaServico(""); setStep(2); }}
                          style={{ ...cardBaseStyle, padding: "28px 24px" }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; }}
                        >
                          <div style={{ fontSize: "32px", marginBottom: "10px" }}>{t.icon}</div>
                          <div style={{ fontSize: "18px", fontWeight: 800, color: "#6001D3", marginBottom: "6px" }}>{t.label}</div>
                          <div style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.4 }}>{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tela 2: Categoria ── */}
                {step === 2 && (
                  <div className="animate-fade-in">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <button onClick={() => setStep(1)} style={btnBackStyle}>← Voltar</button>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                        <strong style={{ color: "#fff" }}>{tipoServico}</strong>
                      </span>
                    </div>
                    <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#fff", margin: "20px 0 28px", lineHeight: 1.2 }}>
                      Selecione a categoria
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
                      {(CATEGORIAS_SERVICO[tipoServico] ?? []).map((cat) => (
                        <button key={cat}
                          onClick={() => { setCategoriaServico(cat); setNormasSelecionadas([]); setStep(3); }}
                          style={{ ...cardBaseStyle, padding: "22px 20px" }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.22)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; }}
                        >
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#6001D3" }}>{cat}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tela 3: Normas (múltipla seleção) ── */}
                {step === 3 && (
                  <div className="animate-fade-in">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <button onClick={() => setStep(2)} style={btnBackStyle}>← Voltar</button>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>{breadcrumb}</span>
                    </div>
                    <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#fff", margin: "20px 0 6px", lineHeight: 1.2 }}>
                      Selecione a(s) norma(s)
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "24px" }}>
                      Você pode selecionar mais de uma norma
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px", marginBottom: "28px" }}>
                      {ISOS_DISPONIVEIS.map((n) => {
                        const sel = normasSelecionadas.includes(n.label);
                        return (
                          <button key={n.label} onClick={() => toggleNorma(n.label)}
                            style={{ ...(sel ? cardSelectedStyle : cardBaseStyle), padding: "16px 14px" }}
                            onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; } }}
                            onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; } }}
                          >
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#6001D3" }}>{n.label}</div>
                            <div style={{ fontSize: "11px", color: sel ? "#7C3AED" : "#6B7280", marginTop: "4px" }}>{n.sub}</div>
                            {sel && <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: 700, color: "#6001D3" }}>✓ Selecionado</div>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => { if (normasSelecionadas.length > 0) { setEstadosSelecionados([]); setCidadesSelecionadas([]); setStep(4); } }}
                        disabled={normasSelecionadas.length === 0}
                        style={{ ...btnPrimaryStyle, opacity: normasSelecionadas.length === 0 ? 0.5 : 1, cursor: normasSelecionadas.length === 0 ? "not-allowed" : "pointer" }}>
                        Continuar →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Tela 4: Estados (múltipla seleção) ── */}
                {step === 4 && (
                  <div className="animate-fade-in">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <button onClick={() => setStep(3)} style={btnBackStyle}>← Voltar</button>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                        {breadcrumb} · {normasSelecionadas.join(", ")}
                      </span>
                    </div>
                    <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#fff", margin: "20px 0 6px", lineHeight: 1.2 }}>
                      Selecione o(s) estado(s)
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "24px" }}>
                      Você pode selecionar mais de um estado
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px", marginBottom: "28px" }}>
                      {estados.map((est) => {
                        const sel = estadosSelecionados.includes(est);
                        return (
                          <button key={est} onClick={() => toggleEstado(est)}
                            style={{ ...(sel ? cardSelectedStyle : cardBaseStyle), padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; } }}
                            onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; } }}
                          >
                            <span style={{ fontSize: "14px", fontWeight: 700, color: sel ? "#6001D3" : "#111" }}>{est}</span>
                            {sel && <span style={{ fontSize: "14px", color: "#6001D3", fontWeight: 800 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => { if (estadosSelecionados.length > 0) setStep(5); }}
                        disabled={estadosSelecionados.length === 0}
                        style={{ ...btnPrimaryStyle, opacity: estadosSelecionados.length === 0 ? 0.5 : 1, cursor: estadosSelecionados.length === 0 ? "not-allowed" : "pointer" }}>
                        Continuar →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Tela 5: Cidades (múltipla seleção, filtradas por estados) ── */}
                {step === 5 && (
                  <div className="animate-fade-in">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <button onClick={() => setStep(4)} style={btnBackStyle}>← Voltar</button>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                        {estadosSelecionados.map((e) => e.split(" — ")[0]).join(", ")}
                      </span>
                    </div>
                    <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#fff", margin: "20px 0 6px", lineHeight: 1.2 }}>
                      Selecione a(s) cidade(s)
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "24px" }}>
                      Você pode selecionar mais de uma cidade
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px", marginBottom: "28px" }}>
                      {cidadesDisponiveis.map((c) => {
                        const sel = cidadesSelecionadas.includes(c);
                        return (
                          <button key={c} onClick={() => toggleCidade(c)}
                            style={{ ...(sel ? cardSelectedStyle : cardBaseStyle), padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)"; } }}
                            onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; } }}
                          >
                            <span style={{ fontSize: "15px", fontWeight: 700, color: sel ? "#6001D3" : "#111" }}>{c}</span>
                            {sel && <span style={{ fontSize: "14px", color: "#6001D3", fontWeight: 800 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => { if (cidadesSelecionadas.length > 0) buscar(); }}
                        disabled={cidadesSelecionadas.length === 0}
                        style={{ ...btnPrimaryStyle, opacity: cidadesSelecionadas.length === 0 ? 0.5 : 1, cursor: cidadesSelecionadas.length === 0 ? "not-allowed" : "pointer" }}>
                        Buscar Fornecedores →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Carregando ── */}
                {step === "loading" && (
                  <div className="animate-fade-in" style={{ textAlign: "center" }}>
                    <h2 className="animate-pulse" style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#fff" }}>
                      Consultando fornecedores...
                    </h2>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Resultados ── */
            <div style={{ paddingBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>
                    Resultados encontrados
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0 }}>
                    {tipoServico} · {categoriaServico} · {normasSelecionadas.join(", ")} · {cidadesSelecionadas.join(", ")}
                  </p>
                </div>
                <button onClick={reset}
                  style={{ padding: "8px 18px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                  Nova busca
                </button>
              </div>

              {servicos.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: "20px", padding: "60px 32px", textAlign: "center", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                  <p style={{ color: "#374151", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>Nenhum resultado encontrado</p>
                  <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 24px" }}>Tente ajustar os filtros ou buscar em outras regiões.</p>
                  <button onClick={reset} style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "12px 28px", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}>
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <button onClick={() => scrollCarousel("left")}
                    style={{ position: "absolute", left: "-16px", top: "50%", transform: "translateY(-50%)", zIndex: 10, width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                    ‹
                  </button>
                  <div ref={carouselRef} style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "24px", paddingTop: "16px", scrollBehavior: "smooth", scrollbarWidth: "thin" as const, scrollbarColor: "rgba(255,255,255,0.5) rgba(255,255,255,0.1)" }}>
                    {servicos.map((s) => {
                      const rb = s.User?.rankTier ? RANK_BADGE[s.User.rankTier] : null;
                      return (
                        <div key={s.id}
                          style={{ minWidth: "280px", maxWidth: "280px", background: "#fff", borderRadius: "24px", padding: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", cursor: "pointer", display: "flex", flexDirection: "column", flexShrink: 0, position: "relative", transition: "transform 0.2s" }}
                          onClick={() => router.push(`/servico/${s.id}`)}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                          {s.imagem ? (
                            <img src={s.imagem} alt={s.titulo} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "14px", marginBottom: "14px" }} />
                          ) : (
                            <div style={{ width: "100%", height: "140px", background: "#F3F4F6", borderRadius: "14px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ color: "#9CA3AF", fontSize: "13px" }}>Sem imagem</span>
                            </div>
                          )}
                          {s.destaque && (
                            <div style={{ position: "absolute", top: "28px", left: "28px", background: "#22C55E", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "3px 7px", borderRadius: "6px", textTransform: "uppercase" as const }}>
                              {s.destaque}
                            </div>
                          )}
                          {rb && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: rb.bg, border: `1.5px solid ${rb.border}`, borderRadius: "20px", padding: "2px 8px 2px 5px", marginBottom: "8px" }}>
                              <span style={{ fontSize: "12px" }}>{rb.icon}</span>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: rb.text }}>{rb.label}</span>
                            </div>
                          )}
                          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{s.titulo}</h3>
                          <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 12px" }}>{s.User?.name ?? "Consultoria"}</p>
                          <div style={{ marginTop: "auto" }}>
                            <button
                              style={{ width: "100%", background: "#00D1B2", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                              onClick={(e) => { e.stopPropagation(); router.push(`/servico/${s.id}`); }}>
                              Solicitar Orçamento
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => scrollCarousel("right")}
                    style={{ position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)", zIndex: 10, width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fadeIn 0.4s ease-out forwards}` }} />
    </div>
  );
}
