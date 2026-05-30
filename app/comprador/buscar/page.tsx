"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { consultarServicos } from "@/app/actions/servicos";
import { CIDADES } from "@/app/lib/cidades";
import CompradorSidebar from "@/app/components/layout/CompradorSidebar";

type Servico = {
  id: number; isoTipo: string; titulo: string; descricao: string; cidade: string;
  destaque: string | null; imagem: string | null;
  User: { name: string; rankScore?: number; rankTier?: string } | null;
};

const RANK_BADGE: Record<string, { icon: string; label: string; bg: string; text: string; border: string }> = {
  PRATA:   { icon: "🥈", label: "Prata",   bg: "#F3F4F6", text: "#4B5563", border: "#9E9E9E" },
  OURO:    { icon: "🥇", label: "Ouro",    bg: "#FFFBEB", text: "#92400E", border: "#FFD700" },
  PLATINA: { icon: "💎", label: "Platina", bg: "#F5F3FF", text: "#6001D3", border: "#A855F7" },
};

export default function CompradorBuscarPage() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardServico, setWizardServico] = useState("");
  const [wizardCidade, setWizardCidade] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: "left" | "right") => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  };

  const handleWizardNext = async () => {
    if (wizardStep === 1 && wizardServico.trim()) {
      setWizardStep(2);
    } else if (wizardStep === 2 && wizardCidade) {
      setWizardStep(3);
      setTimeout(async () => {
        const res = await consultarServicos(wizardServico, wizardCidade);
        if (res.success) setServicos(res.servicos as Servico[]);
        setWizardStep(4);
      }, 2000);
    }
  };

  const resetWizard = () => { setWizardStep(1); setWizardServico(""); setWizardCidade(""); setServicos([]); };

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>
        <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 4px" }}>Buscar ISO</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0 }}>Encontre certificadoras na sua cidade</p>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <CompradorSidebar />

        {/* Conteúdo do wizard */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {wizardStep < 4 ? (
            /* Wizard centralizado dentro da área de conteúdo */
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
              <div style={{ width: "100%", maxWidth: "640px" }}>

                {wizardStep === 1 && (
                  <div className="animate-fade-in">
                    <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#fff", marginBottom: "32px", lineHeight: 1.2 }}>
                      Qual serviço deseja consultar?
                    </h2>
                    <input
                      type="text" autoFocus value={wizardServico}
                      onChange={(e) => setWizardServico(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") handleWizardNext(); }}
                      placeholder="Ex: ISO 9001"
                      style={{ width: "100%", padding: "18px 28px", borderRadius: "16px", border: "none", fontSize: "1.3rem", background: "#fff", color: "#111", outline: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", boxSizing: "border-box" as const }}
                    />
                    <button onClick={handleWizardNext} disabled={!wizardServico.trim()}
                      style={{ marginTop: "24px", padding: "14px 40px", background: "#fff", color: "#6001D3", border: "none", borderRadius: "14px", fontSize: "1rem", fontWeight: 800, cursor: wizardServico.trim() ? "pointer" : "not-allowed", opacity: wizardServico.trim() ? 1 : 0.5, boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}>
                      Próximo →
                    </button>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="animate-fade-in">
                    <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#fff", marginBottom: "32px", lineHeight: 1.2 }}>
                      De qual cidade está falando?
                    </h2>
                    <select autoFocus value={wizardCidade} onChange={(e) => setWizardCidade(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleWizardNext(); }}
                      style={{ width: "100%", padding: "18px 28px", borderRadius: "16px", border: "none", fontSize: "1.3rem", background: "#fff", color: wizardCidade ? "#111" : "#9CA3AF", outline: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", appearance: "none" as const, cursor: "pointer" }}>
                      <option value="" disabled>Selecione uma cidade</option>
                      {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                      <button onClick={() => setWizardStep(1)}
                        style={{ padding: "14px 28px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "14px", fontWeight: 700, cursor: "pointer" }}>
                        ← Voltar
                      </button>
                      <button onClick={handleWizardNext} disabled={!wizardCidade}
                        style={{ padding: "14px 40px", background: "#fff", color: "#6001D3", border: "none", borderRadius: "14px", fontWeight: 800, fontSize: "1rem", cursor: wizardCidade ? "pointer" : "not-allowed", opacity: wizardCidade ? 1 : 0.5, boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}>
                        Buscar
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="animate-fade-in" style={{ textAlign: "center" }}>
                    <h2 className="animate-pulse" style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: "#fff" }}>
                      Consultando...
                    </h2>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Resultados */
            <div style={{ paddingBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", margin: 0 }}>
                  Resultados para <span style={{ color: "rgba(255,255,255,0.8)" }}>{wizardServico}</span> em <span style={{ color: "rgba(255,255,255,0.8)" }}>{wizardCidade}</span>
                </h2>
                <button onClick={resetWizard}
                  style={{ padding: "8px 18px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: "10px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                  Nova busca
                </button>
              </div>

              {servicos.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: "20px", padding: "60px 32px", textAlign: "center", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
                  <p style={{ color: "#374151", fontSize: "16px", fontWeight: 700, margin: "0 0 8px" }}>Nenhum resultado encontrado</p>
                  <p style={{ color: "#9CA3AF", fontSize: "13px", margin: "0 0 24px" }}>Tente buscar por outro tipo de ISO ou cidade.</p>
                  <button onClick={resetWizard} style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "12px 28px", borderRadius: "12px", fontWeight: 700, border: "none", cursor: "pointer" }}>
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