"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";
import { criarListagem, getMinhasISOs } from "@/app/actions/listagens";
import { CIDADES } from "@/app/lib/cidades";

const TODOS_TIPOS_ISO = ["ISO 9001", "ISO 14001", "ISO 45001", "ISO 27001", "ISO 22000", "ISO 50001"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", border: "1.5px solid #E5E7EB",
  borderRadius: "12px", fontSize: "15px", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: "13px", fontWeight: 600, color: "#555", display: "block", marginBottom: "8px",
};

export default function NovaListagemPage() {
  const router = useRouter();
  const [isosPermitidas, setIsosPermitidas] = useState<string[]>([]);
  const [carregandoISOs, setCarregandoISOs] = useState(true);
  const [form, setForm] = useState({
    isoTipo: "", titulo: "", descricao: "", cidade: "", imagem: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!form.isoTipo || !form.titulo || !form.descricao || !form.cidade) {
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
    });
    setLoading(false);
    if (res.success) router.push("/vendedor/listagens");
    else setErro(res.error || "Erro ao criar listagem.");
  };

  return (
    <div style={{ padding: "8px 56px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      <h1 style={{ color: "#fff", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: "32px", marginTop: "8px", flexShrink: 0 }}>Nova Listagem</h1>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <VendedorSidebar />

        <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "40px 48px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", height: "100%", overflowY: "auto" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#111", marginBottom: "8px" }}>Detalhes do Serviço</h2>
          <p style={{ color: "#888", marginBottom: "32px" }}>
            Preencha as informações para publicar seu serviço. O preço será negociado diretamente com o comprador via chat.
          </p>

          {erro && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "14px", color: "#B91C1C", fontSize: "14px", marginBottom: "20px" }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Tipo de ISO *</label>
                {carregandoISOs ? (
                  <div style={{ padding: "14px 16px", border: "1.5px solid #E5E7EB", borderRadius: "12px", fontSize: "15px", color: "#aaa" }}>Carregando...</div>
                ) : (
                  <>
                    <select name="isoTipo" value={form.isoTipo} onChange={handleChange}
                      style={{ ...inputStyle, background: "#fff" }}>
                      <option value="" disabled>Selecione uma ISO</option>
                      {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {isosPermitidas.length > 0 && (
                      <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "6px", margin: "6px 0 0" }}>
                        Apenas ISOs autorizadas no seu cadastro
                      </p>
                    )}
                  </>
                )}
              </div>
              <div>
                <label style={labelStyle}>Cidade de atuação *</label>
                <select name="cidade" value={form.cidade} onChange={handleChange}
                  style={{ ...inputStyle, background: "#fff" }}>
                  <option value="" disabled>Selecione uma cidade</option>
                  {CIDADES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Título da Listagem *</label>
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

            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>💬</span>
              <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
                <strong>Preço negociável:</strong> O valor do serviço será combinado diretamente com o comprador através do chat da plataforma.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "12px" }}>
              <button type="button" onClick={() => router.back()}
                style={{ padding: "14px 28px", borderRadius: "12px", border: "1.5px solid #E5E7EB", color: "#666", fontWeight: 700, fontSize: "15px", background: "#fff", cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading || carregandoISOs}
                style={{ background: "linear-gradient(90deg,#6001D3,#A872F0)", color: "#fff", padding: "14px 36px", borderRadius: "12px", fontWeight: 800, fontSize: "15px", border: "none", cursor: "pointer", opacity: (loading || carregandoISOs) ? 0.7 : 1 }}>
                {loading ? "Publicando..." : "Publicar Listagem"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}