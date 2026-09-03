"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";
import { criarListagem, getMinhasISOs } from "@/app/actions/normas";
import { CIDADES } from "@/app/lib/cidades";
import { TIPOS_SERVICO, CATEGORIAS_SERVICO } from "@/app/lib/estados";

const TODOS_TIPOS_ISO = [
  // Certific\u00e1veis
  "ISO 9001", "ISO 14001", "ISO 45001", "ISO/IEC 27001", "ISO 22000", "ISO 50001",
  "ISO 22301", "ISO 37001", "ISO 37301", "ISO 39001", "ISO 41001", "ISO/IEC 42001",
  "ISO 44001", "ISO 46001", "ISO 21001", "ISO 20121", "ISO 21401", "ISO 21101",
  "ISO 35001", "ISO 37101", "ISO 7101", "ISO 13485", "ISO/IEC 20000-1", "ISO 22163",
  "ISO 28000", "ISO 55001", "ISO 56001",
  // Diretrizes
  "ISO 31000", "IEC 31010", "ISO 19011", "ISO 9004", "ISO 14004", "ISO 45002",
  "ISO 45003", "ISO 37002", "ISO 37003", "ISO 44002", "ISO 56002", "ISO 56003",
  "ISO 56005", "ISO 56006", "ISO 56007", "ISO 56008", "ISO 37120", "ISO 37122",
  "ISO 37123", "ISO 37125",
  // Outros referenciais
  "IATF 16949", "VDA 6.3", "FSSC 22000", "PBQP-H / SiAC", "ISO/IEC 17025", "Outras",
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", border: "1.5px solid rgba(232, 237, 240, 0.18)",
  borderRadius: "12px", fontSize: "14px", boxSizing: "border-box", background: "#020D1D", color: "#FFFFFF", outline: "none",
};
const labelStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 500, color: "#E8EDF0", display: "block", marginBottom: "8px",
};

export default function NovaListagemPage() {
  const router = useRouter();
  const [isosPermitidas, setIsosPermitidas] = useState<string[]>([]);
  const [carregandoISOs, setCarregandoISOs] = useState(true);
  const [form, setForm] = useState({
    isoTipo: "", titulo: "", descricao: "", cidade: "", imagem: "",
    tipoServico: "", categoriaServico: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getMinhasISOs().then((isos) => {
      setIsosPermitidas(isos);
      if (isos.length > 0) setForm((f) => ({ ...f, isoTipo: isos[0] }));
      setCarregandoISOs(false);
    });
  }, []);

  const tiposDisponiveis = isosPermitidas.length > 0 ? isosPermitidas : TODOS_TIPOS_ISO;
  const categoriasDisponiveis = form.tipoServico ? (CATEGORIAS_SERVICO[form.tipoServico] ?? []) : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "tipoServico" ? { categoriaServico: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!form.isoTipo || !form.titulo || !form.descricao || !form.cidade || !form.tipoServico || !form.categoriaServico) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    const res = await criarListagem({
      isoTipo: form.isoTipo,
      titulo: form.titulo,
      descricao: form.descricao,
      cidade: form.cidade,
      imagem: form.imagem || undefined,
      tipoServico: form.tipoServico,
      categoriaServico: form.categoriaServico,
    });
    setLoading(false);
    if (res.success) router.push("/vendedor/normas");
    else setErro(res.error || "Erro ao criar norma.");
  };

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <h1 style={{ color: "#FFFFFF", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>Nova Norma</h1>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <VendedorSidebar />

        <div style={{ flex: 1, background: "#03162D", border: "1px solid rgba(232, 237, 240, 0.15)", borderRadius: "20px", padding: "40px 48px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", height: "100%", overflowY: "auto", color: "#FFFFFF" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>Detalhes do Serviço</h2>
          <p style={{ color: "#A7B0B8", marginBottom: "32px", fontSize: "14px", fontWeight: 400 }}>
            Preencha as informações para que compradores encontrem seu serviço. O preço será negociado via chat.
          </p>

          {erro && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "14px", color: "#F87171", fontSize: "13px", marginBottom: "20px", fontWeight: 500 }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Tipo de Serviço + Categoria */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Tipo de Serviço *</label>
                <select name="tipoServico" value={form.tipoServico} onChange={handleChange}
                  style={{ ...inputStyle }}>
                  <option value="" disabled style={{ background: "#020D1D", color: "#A7B0B8" }}>Selecione o tipo</option>
                  {TIPOS_SERVICO.map((t) => (
                    <option key={t.label} value={t.label} style={{ background: "#020D1D", color: "#FFFFFF" }}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Categoria *</label>
                <select name="categoriaServico" value={form.categoriaServico} onChange={handleChange}
                  disabled={!form.tipoServico}
                  style={{ ...inputStyle, opacity: form.tipoServico ? 1 : 0.5 }}>
                  <option value="" disabled style={{ background: "#020D1D", color: "#A7B0B8" }}>{form.tipoServico ? "Selecione a categoria" : "Selecione o tipo primeiro"}</option>
                  {categoriasDisponiveis.map((c) => (
                    <option key={c} value={c} style={{ background: "#020D1D", color: "#FFFFFF" }}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Norma ISO + Cidade */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Norma ISO *</label>
                {carregandoISOs ? (
                  <p style={{ color: "#00EBCB", fontSize: "13px" }}>Carregando normas autorizadas...</p>
                ) : (
                  <>
                    <select name="isoTipo" value={form.isoTipo} onChange={handleChange}
                      style={{ ...inputStyle }}>
                      <option value="" disabled style={{ background: "#020D1D", color: "#A7B0B8" }}>Selecione uma norma</option>
                      {tiposDisponiveis.map((t) => <option key={t} value={t} style={{ background: "#020D1D", color: "#FFFFFF" }}>{t}</option>)}
                    </select>
                    {isosPermitidas.length > 0 && (
                      <p style={{ fontSize: "11px", color: "#00A9D6", marginTop: "6px", margin: "6px 0 0" }}>
                        Apenas normas autorizadas no seu cadastro
                      </p>
                    )}
                  </>
                )}
              </div>
              <div>
                <label style={labelStyle}>Cidade de atuação *</label>
                <select name="cidade" value={form.cidade} onChange={handleChange}
                  style={{ ...inputStyle }}>
                  <option value="" disabled style={{ background: "#020D1D", color: "#A7B0B8" }}>Selecione uma cidade</option>
                  {CIDADES.map((c) => <option key={c} value={c} style={{ background: "#020D1D", color: "#FFFFFF" }}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Título da Norma *</label>
              <input name="titulo" value={form.titulo} onChange={handleChange}
                placeholder="Ex: Consultoria ISO 9001 — Implantação e Certificação"
                style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Descrição completa *</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={5}
                placeholder="Descreva o serviço oferecido, metodologia, prazo estimado, o que está incluso..."
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div>
              <label style={labelStyle}>URL da Imagem</label>
              <input name="imagem" value={form.imagem} onChange={handleChange}
                placeholder="https://exemplo.com/imagem.jpg"
                style={inputStyle} />
            </div>

            <div style={{ background: "rgba(0, 169, 214, 0.1)", border: "1px solid rgba(0, 169, 214, 0.25)", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>💬</span>
              <p style={{ margin: 0, fontSize: "13px", color: "#00EBCB" }}>
                <strong>Preço negociável:</strong> O valor do serviço será combinado diretamente com o comprador através do chat da plataforma.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "12px" }}>
              <button type="button" onClick={() => router.back()}
                style={{ padding: "14px 28px", borderRadius: "12px", border: "1.5px solid rgba(232, 237, 240, 0.2)", color: "#E8EDF0", fontWeight: 600, fontSize: "14px", background: "transparent", cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading || carregandoISOs}
                style={{ background: "#00EBCB", color: "#020D1D", padding: "14px 36px", borderRadius: "12px", fontWeight: 600, fontSize: "15px", border: "none", cursor: "pointer", opacity: (loading || carregandoISOs) ? 0.7 : 1, boxShadow: "0 4px 14px rgba(0,235,203,0.3)" }}>
                {loading ? "Publicando..." : "Publicar Norma"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
