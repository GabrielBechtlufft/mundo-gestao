"use client";

import { useState } from "react";
import Link from "next/link";
import { solicitarCadastro } from "@/app/actions/cadastro";
import { Logo } from "@/app/components/layout/Logo";
import { TODOS_ESTADOS } from "@/app/lib/estados";

const ISO_OPTIONS = [
  // Normas certificáveis – Sistemas de Gestão
  { value: "ISO 9001",         label: "ISO 9001",         desc: "Sistema de Gestão da Qualidade" },
  { value: "ISO 14001",        label: "ISO 14001",        desc: "Sistema de Gestão Ambiental" },
  { value: "ISO 45001",        label: "ISO 45001",        desc: "Gestão de Saúde e Segurança Ocupacional" },
  { value: "ISO/IEC 27001",    label: "ISO/IEC 27001",    desc: "Sistema de Gestão de Segurança da Informação" },
  { value: "ISO 22000",        label: "ISO 22000",        desc: "Sistema de Gestão de Segurança de Alimentos" },
  { value: "ISO 50001",        label: "ISO 50001",        desc: "Sistema de Gestão de Energia" },
  { value: "ISO 22301",        label: "ISO 22301",        desc: "Sistema de Gestão de Continuidade de Negócios" },
  { value: "ISO 37001",        label: "ISO 37001",        desc: "Sistema de Gestão Antissuborno" },
  { value: "ISO 37301",        label: "ISO 37301",        desc: "Sistema de Gestão de Compliance" },
  { value: "ISO 39001",        label: "ISO 39001",        desc: "Sistema de Gestão de Segurança Viária" },
  { value: "ISO 41001",        label: "ISO 41001",        desc: "Sistema de Gestão de Facility Management" },
  { value: "ISO/IEC 42001",    label: "ISO/IEC 42001",    desc: "Sistema de Gestão de Inteligência Artificial" },
  { value: "ISO 44001",        label: "ISO 44001",        desc: "Sistema de Gestão de Relacionamentos Colaborativos" },
  { value: "ISO 46001",        label: "ISO 46001",        desc: "Sistema de Gestão de Eficiência Hídrica" },
  { value: "ISO 21001",        label: "ISO 21001",        desc: "Sistema de Gestão para Organizações Educacionais" },
  { value: "ISO 20121",        label: "ISO 20121",        desc: "Sistema de Gestão de Sustentabilidade de Eventos" },
  { value: "ISO 21401",        label: "ISO 21401",        desc: "Sustentabilidade para Meios de Hospedagem" },
  { value: "ISO 21101",        label: "ISO 21101",        desc: "Segurança para Turismo de Aventura" },
  { value: "ISO 35001",        label: "ISO 35001",        desc: "Gestão de Biorrisco para Laboratórios" },
  { value: "ISO 37101",        label: "ISO 37101",        desc: "Desenvolvimento Sustentável em Comunidades" },
  { value: "ISO 7101",         label: "ISO 7101",         desc: "Gestão da Qualidade em Organizações de Saúde" },
  { value: "ISO 13485",        label: "ISO 13485",        desc: "Gestão da Qualidade para Dispositivos Médicos" },
  { value: "ISO/IEC 20000-1",  label: "ISO/IEC 20000-1",  desc: "Sistema de Gestão de Serviços de TI" },
  { value: "ISO 22163",        label: "ISO 22163",        desc: "Gestão da Qualidade no Setor Ferroviário" },
  { value: "ISO 28000",        label: "ISO 28000",        desc: "Segurança para a Cadeia de Suprimentos" },
  { value: "ISO 55001",        label: "ISO 55001",        desc: "Sistema de Gestão de Ativos" },
  { value: "ISO 56001",        label: "ISO 56001",        desc: "Sistema de Gestão da Inovação" },
  // Normas não certificáveis – Diretrizes e Guias
  { value: "ISO 31000",        label: "ISO 31000",        desc: "Gestão de Riscos – Diretrizes" },
  { value: "IEC 31010",        label: "IEC 31010",        desc: "Técnicas de Avaliação de Riscos" },
  { value: "ISO 19011",        label: "ISO 19011",        desc: "Diretrizes para Auditoria de SGS" },
  { value: "ISO 9004",         label: "ISO 9004",         desc: "Qualidade – Orientação para Sucesso Sustentado" },
  { value: "ISO 14004",        label: "ISO 14004",        desc: "Gestão Ambiental – Diretrizes" },
  { value: "ISO 45002",        label: "ISO 45002",        desc: "Diretrizes para Implementação da ISO 45001" },
  { value: "ISO 45003",        label: "ISO 45003",        desc: "Saúde Psicológica e Segurança no Trabalho" },
  { value: "ISO 37002",        label: "ISO 37002",        desc: "Sistemas de Gestão de Denúncias" },
  { value: "ISO 37003",        label: "ISO 37003",        desc: "Gestão de Controle de Fraude" },
  { value: "ISO 44002",        label: "ISO 44002",        desc: "Diretrizes para Implementação da ISO 44001" },
  { value: "ISO 56002",        label: "ISO 56002",        desc: "Gestão da Inovação – Diretrizes" },
  { value: "ISO 56003",        label: "ISO 56003",        desc: "Gestão da Inovação – Parcerias" },
  { value: "ISO 56005",        label: "ISO 56005",        desc: "Gestão da Inovação – Propriedade Intelectual" },
  { value: "ISO 56006",        label: "ISO 56006",        desc: "Gestão da Inovação – Inteligência Estratégica" },
  { value: "ISO 56007",        label: "ISO 56007",        desc: "Gestão da Inovação – Oportunidades e Ideias" },
  { value: "ISO 56008",        label: "ISO 56008",        desc: "Gestão da Inovação – Medição das Operações" },
  { value: "ISO 37120",        label: "ISO 37120",        desc: "Cidades Sustentáveis – Indicadores Urbanos" },
  { value: "ISO 37122",        label: "ISO 37122",        desc: "Cidades Sustentáveis – Cidades Inteligentes" },
  { value: "ISO 37123",        label: "ISO 37123",        desc: "Cidades Sustentáveis – Cidades Resilientes" },
  { value: "ISO 37125",        label: "ISO 37125",        desc: "Cidades Sustentáveis – Indicadores ESG" },
  // Outros referenciais/esquemas
  { value: "IATF 16949",       label: "IATF 16949",       desc: "Gestão da Qualidade Automotiva" },
  { value: "VDA 6.3",          label: "VDA 6.3",          desc: "Auditoria de Processo – Automotivo" },
  { value: "FSSC 22000",       label: "FSSC 22000",       desc: "Certificação de Segurança de Alimentos" },
  { value: "PBQP-H / SiAC",   label: "PBQP-H / SiAC",   desc: "Avaliação da Conformidade – Serviços e Obras" },
  { value: "ISO/IEC 17025",    label: "ISO/IEC 17025",    desc: "Competência de Laboratórios de Ensaio e Calibração" },
];


function formatCNPJ(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(v: string) {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 2) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `+55 (${d}`;
  if (d.length <= 3) return `+55 (${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`;
  return `+55 (${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 16px", background: "#020D1D", color: "#FFFFFF", border: "1.5px solid rgba(232, 237, 240, 0.18)", borderRadius: "12px", fontSize: "14px", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 500, color: "#E8EDF0", display: "block", marginBottom: "6px" };

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
    else if (name === "telefone") setForm((p) => ({ ...p, telefone: formatPhone(value) }));
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
    if (!data.url) throw new Error(data.error || "Erro no upload");
    return data.url;
  };

  const handleSubmit = async () => {
    if (selectedISOs.length === 0) {
      setErro("Selecione ao menos uma norma ISO.");
      return;
    }
    for (const iso of selectedISOs) {
      const cert = isoCerts[iso];
      if (!cert?.validade) {
        setErro(`Informe a data de validade do certificado para ${iso}.`);
        return;
      }
      if (!cert?.arquivo) {
        setErro(`Anexe o arquivo do certificado para ${iso}.`);
        return;
      }
    }

    setErro("");
    setLoading(true);
    setUploading(true);

    try {
      const certData: Record<string, { validade: string; arquivoUrl: string }> = {};
      for (const iso of selectedISOs) {
        const cert = isoCerts[iso];
        const url = await uploadFile(cert.arquivo!);
        certData[iso] = { validade: cert.validade, arquivoUrl: url };
      }
      setUploading(false);

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
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #020D1D 0%, #03162D 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", color: "#FFFFFF" }}>
        <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "28px", padding: "48px", maxWidth: "520px", width: "100%", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#FFFFFF", marginBottom: "12px" }}>Pedido enviado!</h2>
          <p style={{ color: "#A7B0B8", lineHeight: 1.6, marginBottom: "32px", fontSize: "14px" }}>
            A solicitação de <strong style={{ color: "#FFFFFF" }}>{form.razaoSocial}</strong> foi recebida e está <strong style={{ color: "#00EBCB" }}>aguardando aprovação</strong> do administrador. Você receberá um e-mail com o resultado.
          </p>
          <Link href="/" style={{ background: "#00EBCB", color: "#020D1D", padding: "14px 32px", borderRadius: "12px", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #020D1D 0%, #03162D 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", color: "#FFFFFF" }}>
      <header style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px" }}>
        <Link href="/" className="no-underline transition-transform hover:opacity-90 active:scale-95"><Logo size="md" /></Link>
        <Link href="/login" style={{ background: "#00EBCB", color: "#020D1D", padding: "10px 28px", borderRadius: "10px", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>Entrar</Link>
      </header>

      <div style={{ background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "28px", padding: "40px", maxWidth: "680px", width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", marginTop: "80px" }}>

        {/* Indicador de progresso */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
              {step === 1 ? "Dados da Empresa" : "Certificação & ISOs"}
            </h1>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#A7B0B8" }}>Etapa {step} de 2</span>
          </div>
          <div style={{ height: "6px", background: "rgba(232, 237, 240, 0.1)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progresso}%`, background: "linear-gradient(90deg, #00A9D6, #00EBCB)", borderRadius: "3px", transition: "width 0.4s ease" }} />
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            {[
              { n: 1, label: "Empresa & Contato" },
              { n: 2, label: "Certificação" },
            ].map((s) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: step >= s.n ? "#00EBCB" : "rgba(232, 237, 240, 0.12)", color: step >= s.n ? "#020D1D" : "#A7B0B8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>{s.n}</div>
                <span style={{ fontSize: "12px", fontWeight: step === s.n ? 600 : 400, color: step === s.n ? "#00EBCB" : "#A7B0B8" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {erro && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "14px", color: "#F87171", fontSize: "13px", marginBottom: "20px", fontWeight: 500 }}>{erro}</div>}

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
              <label style={labelStyle}>Estado de atuação *</label>
              <select name="cidade" value={form.cidade} onChange={handleChange} style={{ ...inputStyle, appearance: "none", cursor: "pointer", color: form.cidade ? "#FFFFFF" : "#A7B0B8" }}>
                <option value="" disabled>Selecione um estado</option>
                {TODOS_ESTADOS.map((c) => <option key={c} value={c} style={{ background: "#020D1D", color: "#FFFFFF" }}>{c}</option>)}
              </select>
            </div>

            <div style={{ borderTop: "1px solid rgba(232, 237, 240, 0.12)", paddingTop: "16px", marginTop: "4px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#00EBCB", margin: "0 0 12px" }}>Responsável pelo cadastro</p>
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
              style={{ background: "#00EBCB", color: "#020D1D", padding: "15px", borderRadius: "14px", fontWeight: 600, fontSize: "15px", border: "none", cursor: "pointer", marginTop: "8px", boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}
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
              <label style={labelStyle}>Quais normas ISO compõem o escopo do organismo? *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {ISO_OPTIONS.map((iso) => (
                  <button key={iso.value} type="button" onClick={() => toggleISO(iso.value)}
                    style={{ padding: "12px 16px", borderRadius: "12px", border: selectedISOs.includes(iso.value) ? "2px solid #00EBCB" : "1.5px solid rgba(232, 237, 240, 0.15)", background: selectedISOs.includes(iso.value) ? "rgba(0, 235, 203, 0.12)" : "#020D1D", color: selectedISOs.includes(iso.value) ? "#00EBCB" : "#A7B0B8", fontSize: "13px", fontWeight: selectedISOs.includes(iso.value) ? 600 : 500, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                    <div style={{ fontWeight: 700, color: selectedISOs.includes(iso.value) ? "#00EBCB" : "#FFFFFF" }}>{selectedISOs.includes(iso.value) ? "✓ " : ""}{iso.label}</div>
                    <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "2px", color: selectedISOs.includes(iso.value) ? "#E8EDF0" : "#A7B0B8" }}>{iso.desc}</div>
                  </button>
                ))}
              </div>
              {selectedISOs.length > 0 && <p style={{ fontSize: "12px", color: "#00EBCB", marginTop: "8px", fontWeight: 600 }}>{selectedISOs.length} norma{selectedISOs.length > 1 ? "s" : ""} ISO selecionada{selectedISOs.length > 1 ? "s" : ""}</p>}
            </div>

            {/* Campos por ISO */}
            {selectedISOs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "#E8EDF0" }}>
                  Informe o certificado para cada ISO selecionada:
                </p>
                {selectedISOs.map((isoValue) => {
                  const isoMeta = ISO_OPTIONS.find((o) => o.value === isoValue);
                  const cert = isoCerts[isoValue] || { validade: "", arquivo: null };
                  return (
                    <div key={isoValue} style={{ border: "1.5px solid rgba(232, 237, 240, 0.15)", borderRadius: "14px", padding: "16px 18px", background: "#020D1D" }}>
                      <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#00EBCB" }}>
                        {isoValue} <span style={{ fontWeight: 500, color: "#A7B0B8" }}>— {isoMeta?.desc}</span>
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
                          <label style={labelStyle}>Certificado válido *</label>
                          <div style={{ border: cert.arquivo ? "2px solid #00EBCB" : "2px dashed rgba(232, 237, 240, 0.25)", borderRadius: "10px", padding: "10px 14px", textAlign: "center", background: cert.arquivo ? "rgba(0, 235, 203, 0.08)" : "transparent", cursor: "pointer", position: "relative", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setIsoCertArquivo(isoValue, e.target.files?.[0] || null)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                            {cert.arquivo ? (
                              <div style={{ overflow: "hidden" }}>
                                <p style={{ fontSize: "12px", fontWeight: 700, color: "#00EBCB", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{cert.arquivo.name}</p>
                                <p style={{ fontSize: "10px", color: "#A7B0B8", margin: 0 }}>{(cert.arquivo.size / 1024 / 1024).toFixed(1)} MB · trocar</p>
                              </div>
                            ) : (
                              <p style={{ fontSize: "12px", color: "#A7B0B8", margin: 0 }}>📎 PDF, PNG, JPG</p>
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
                style={{ flex: 1, padding: "14px", border: "1.5px solid rgba(232, 237, 240, 0.2)", background: "transparent", borderRadius: "14px", fontWeight: 600, fontSize: "14px", color: "#E8EDF0", cursor: "pointer" }}>
                ← Voltar
              </button>
              <button type="button" onClick={handleSubmit} disabled={loading}
                style={{ flex: 2, padding: "14px", background: "#00EBCB", color: "#020D1D", borderRadius: "14px", fontWeight: 600, fontSize: "15px", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}>
                {uploading ? "Enviando documentos..." : loading ? "Enviando..." : "Solicitar Cadastro"}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#A7B0B8" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: "#00EBCB", fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}