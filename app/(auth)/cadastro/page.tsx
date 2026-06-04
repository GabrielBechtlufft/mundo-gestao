"use client";

import { useState } from "react";
import Link from "next/link";
import { solicitarCadastro } from "@/app/actions/cadastro";
import { Logo } from "@/app/components/layout/Logo";
import { CIDADES } from "@/app/lib/cidades";

const ISO_OPTIONS = [
  { value: "ISO 9001",  label: "ISO 9001",  desc: "Gestão da Qualidade" },
  { value: "ISO 14001", label: "ISO 14001", desc: "Gestão Ambiental" },
  { value: "ISO 45001", label: "ISO 45001", desc: "Segurança do Trabalho" },
  { value: "ISO 27001", label: "ISO 27001", desc: "Segurança da Informação" },
  { value: "ISO 22000", label: "ISO 22000", desc: "Segurança Alimentar" },
  { value: "ISO 50001", label: "ISO 50001", desc: "Gestão de Energia" },
];

function formatCNPJ(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", border: "1.5px solid #E5E7EB", borderRadius: "12px", fontSize: "15px", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { fontSize: "13px", fontWeight: 600, color: "#555", display: "block", marginBottom: "6px" };

type IsoCert = { validade: string; arquivo: File | null };

export default function CadastroPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    razaoSocial: "", cnpj: "", email: "", telefone: "", cidade: "",
    nomeContato: "", cargoContato: "", mensagem: "",
  });
  const [selectedISOs, setSelectedISOs] = useState<string[]>([]);
  const [isoCerts, setIsoCerts] = useState<Record<string, IsoCert>>({});
  const [uploading, setUploading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "cnpj") setForm((p) => ({ ...p, cnpj: formatCNPJ(value) }));
    else setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleISO = (iso: string) => {
    setSelectedISOs((prev) => {
      if (prev.includes(iso)) {
        setIsoCerts((c) => { const n = { ...c }; delete n[iso]; return n; });
        return prev.filter((i) => i !== iso);
      }
      setIsoCerts((c) => ({ ...c, [iso]: { validade: "", arquivo: null } }));
      return [...prev, iso];
    });
  };

  const setIsoCertValidade = (iso: string, validade: string) =>
    setIsoCerts((c) => ({ ...c, [iso]: { ...c[iso], validade } }));

  const setIsoCertArquivo = (iso: string, arquivo: File | null) => {
    if (arquivo && arquivo.size > 5 * 1024 * 1024) { setErro(`Arquivo de ${iso} muito grande. Máximo: 5MB.`); return; }
    setIsoCerts((c) => ({ ...c, [iso]: { ...c[iso], arquivo } }));
    setErro("");
  };

  const validarStep1 = () => {
    if (!form.razaoSocial || !form.cnpj || !form.email || !form.telefone || !form.cidade) {
      setErro("Preencha todos os campos obrigatórios."); return false;
    }
    setErro(""); return true;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Erro no upload");
    return data.url;
  };

  const handleSubmit = async () => {
    setErro("");
    if (selectedISOs.length === 0) { setErro("Selecione pelo menos uma ISO."); return; }
    for (const iso of selectedISOs) {
      if (!isoCerts[iso]?.validade) { setErro(`Informe a validade do certificado para ${iso}.`); return; }
      if (!isoCerts[iso]?.arquivo) { setErro(`Envie o documento comprovante para ${iso}.`); return; }
    }

    setLoading(true);
    setUploading(true);

    try {
      const uploads: Record<string, string> = {};
      for (const iso of selectedISOs) {
        const arquivo = isoCerts[iso]?.arquivo;
        if (arquivo) uploads[iso] = await uploadFile(arquivo);
      }
      setUploading(false);

      const certData = selectedISOs.map((iso) => ({
        iso,
        validade: isoCerts[iso]?.validade || "",
        documento: uploads[iso] || "",
      }));

      const res = await solicitarCadastro({
        nome: form.razaoSocial, cnpj: form.cnpj, email: form.email,
        telefone: form.telefone, cidade: form.cidade,
        nomeContato: form.nomeContato || undefined,
        cargoContato: form.cargoContato || undefined,
        isosVendidas: selectedISOs.join(","),
        certificacoesISO: JSON.stringify(certData),
        mensagem: form.mensagem || undefined,
      });

      setLoading(false);
      if (res.success) setEnviado(true);
      else setErro(res.error || "Erro ao enviar.");
    } catch (err: any) {
      setErro(err.message || "Erro ao enviar documentos.");
      setLoading(false);
      setUploading(false);
    }
  };

  const progresso = step === 1 ? 50 : 100;

  if (enviado) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #6001D3 0%, #A872F0 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ background: "#fff", borderRadius: "28px", padding: "48px", maxWidth: "520px", width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#111", marginBottom: "12px" }}>Pedido enviado!</h2>
          <p style={{ color: "#666", lineHeight: 1.6, marginBottom: "32px" }}>
            A solicitação de <strong>{form.razaoSocial}</strong> foi recebida e está <strong>aguardando aprovação</strong> do administrador. Você receberá um e-mail com o resultado.
          </p>
          <Link href="/" style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "14px 32px", borderRadius: "12px", fontWeight: 700, textDecoration: "none" }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #6001D3 0%, #A872F0 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <header style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px" }}>
        <Link href="/" className="no-underline transition-transform hover:opacity-90 active:scale-95"><Logo size="md" /></Link>
        <Link href="/login" style={{ background: "#fff", color: "#6001D3", padding: "10px 28px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>Entrar</Link>
      </header>

      <div style={{ background: "#fff", borderRadius: "28px", padding: "48px", maxWidth: "680px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", marginTop: "80px" }}>

        {/* Indicador de progresso */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#111", margin: 0 }}>
              {step === 1 ? "Dados da Empresa" : "Certificação & ISOs"}
            </h1>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#9CA3AF" }}>Etapa {step} de 2</span>
          </div>
          <div style={{ height: "6px", background: "#F3F4F6", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progresso}%`, background: "linear-gradient(90deg,#6001D3,#A872F0)", borderRadius: "3px", transition: "width 0.4s ease" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            {[
              { n: 1, label: "Empresa & Contato" },
              { n: 2, label: "Certificação" },
            ].map((s) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: step >= s.n ? "#6001D3" : "#F3F4F6", color: step >= s.n ? "#fff" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>{s.n}</div>
                <span style={{ fontSize: "12px", fontWeight: step === s.n ? 700 : 500, color: step === s.n ? "#6001D3" : "#9CA3AF" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {erro && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "14px", color: "#B91C1C", fontSize: "14px", marginBottom: "20px" }}>{erro}</div>}

        {/* ── ETAPA 1 ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Razão Social *</label>
              <input name="razaoSocial" value={form.razaoSocial} onChange={handleChange} placeholder="Nome da empresa conforme CNPJ" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>CNPJ *</label>
              <input name="cnpj" value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" style={inputStyle} maxLength={18} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>E-mail corporativo *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="contato@empresa.com.br" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefone *</label>
                <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(00) 00000-0000" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Cidade de atuação *</label>
              <select name="cidade" value={form.cidade} onChange={handleChange} style={{ ...inputStyle, appearance: "none", cursor: "pointer", color: form.cidade ? "#111" : "#9CA3AF" }}>
                <option value="" disabled>Selecione uma cidade</option>
                {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "16px", marginTop: "4px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#6001D3", margin: "0 0 12px" }}>Responsável pelo cadastro</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Nome do responsável</label>
                  <input name="nomeContato" value={form.nomeContato} onChange={handleChange} placeholder="João da Silva" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Cargo</label>
                  <input name="cargoContato" value={form.cargoContato} onChange={handleChange} placeholder="Diretor, Consultor..." style={inputStyle} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { if (validarStep1()) setStep(2); }}
              style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "16px", borderRadius: "14px", fontWeight: 800, fontSize: "16px", border: "none", cursor: "pointer", marginTop: "8px" }}
            >
              Próximo →
            </button>
          </div>
        )}

        {/* ── ETAPA 2 ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* ISOs */}
            <div>
              <label style={labelStyle}>Quais ISOs a empresa certifica? *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {ISO_OPTIONS.map((iso) => (
                  <button key={iso.value} type="button" onClick={() => toggleISO(iso.value)}
                    style={{ padding: "12px 16px", borderRadius: "12px", border: selectedISOs.includes(iso.value) ? "2px solid #6001D3" : "1.5px solid #E5E7EB", background: selectedISOs.includes(iso.value) ? "#F3E8FF" : "#fff", color: selectedISOs.includes(iso.value) ? "#6001D3" : "#555", fontSize: "13px", fontWeight: selectedISOs.includes(iso.value) ? 700 : 500, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                    <div style={{ fontWeight: 700 }}>{selectedISOs.includes(iso.value) ? "✓ " : ""}{iso.label}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>{iso.desc}</div>
                  </button>
                ))}
              </div>
              {selectedISOs.length > 0 && <p style={{ fontSize: "12px", color: "#6001D3", marginTop: "8px", fontWeight: 600 }}>{selectedISOs.length} ISO{selectedISOs.length > 1 ? "s" : ""} selecionada{selectedISOs.length > 1 ? "s" : ""}</p>}
            </div>

            {/* Campos por ISO */}
            {selectedISOs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>
                  Informe o certificado para cada ISO selecionada:
                </p>
                {selectedISOs.map((isoValue) => {
                  const isoMeta = ISO_OPTIONS.find((o) => o.value === isoValue);
                  const cert = isoCerts[isoValue] || { validade: "", arquivo: null };
                  return (
                    <div key={isoValue} style={{ border: "1.5px solid #E5E7EB", borderRadius: "14px", padding: "16px 18px", background: "#FAFAFA" }}>
                      <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#6001D3" }}>
                        {isoValue} <span style={{ fontWeight: 500, color: "#6B7280" }}>— {isoMeta?.desc}</span>
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "start" }}>
                        <div>
                          <label style={labelStyle}>Validade do certificado *</label>
                          <input
                            type="date"
                            value={cert.validade}
                            onChange={(e) => setIsoCertValidade(isoValue, e.target.value)}
                            style={inputStyle}
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Documento comprovante *</label>
                          <div style={{ border: cert.arquivo ? "2px solid #22C55E" : "2px dashed #D1D5DB", borderRadius: "10px", padding: "10px 14px", textAlign: "center", background: cert.arquivo ? "#F0FFF4" : "#fff", cursor: "pointer", position: "relative", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setIsoCertArquivo(isoValue, e.target.files?.[0] || null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                            {cert.arquivo ? (
                              <div style={{ overflow: "hidden" }}>
                                <p style={{ fontSize: "12px", fontWeight: 700, color: "#22C55E", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{cert.arquivo.name}</p>
                                <p style={{ fontSize: "10px", color: "#888", margin: 0 }}>{(cert.arquivo.size / 1024 / 1024).toFixed(1)} MB · trocar</p>
                              </div>
                            ) : (
                              <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>📎 PDF, PNG, JPG</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mensagem */}
            <div>
              <label style={labelStyle}>Mensagem (opcional)</label>
              <textarea name="mensagem" value={form.mensagem} onChange={handleChange} placeholder="Informações adicionais sobre a empresa..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
              <button type="button" onClick={() => { setErro(""); setStep(1); }}
                style={{ flex: 1, padding: "14px", border: "1.5px solid #E5E7EB", background: "transparent", borderRadius: "14px", fontWeight: 700, fontSize: "15px", color: "#555", cursor: "pointer" }}>
                ← Voltar
              </button>
              <button type="button" onClick={handleSubmit} disabled={loading}
                style={{ flex: 2, padding: "14px", background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", borderRadius: "14px", fontWeight: 800, fontSize: "15px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {uploading ? "Enviando documentos..." : loading ? "Enviando..." : "Solicitar Cadastro"}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#888" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: "#6001D3", fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}