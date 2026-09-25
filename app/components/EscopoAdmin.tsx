"use client";
import { useState } from "react";
import EscopoEditor from "./EscopoEditor";
import { ISOS_DISPONIVEIS } from "@/app/lib/estados";
import { stringList } from "@/app/lib/cadastro";
import { atualizarEscopoVendedorAdmin } from "@/app/actions/admin";

export default function EscopoAdmin({ vendedor }: { vendedor: { id: string; isosVendidas: string | null; servicosCategorias?: string; estadosAtuacao?: string } }) {
  const [servicos, setServicos] = useState(() => stringList(vendedor.servicosCategorias));
  const [estados, setEstados] = useState(() => stringList(vendedor.estadosAtuacao));
  const [normas, setNormas] = useState(() => vendedor.isosVendidas?.split(",").map((iso) => iso.trim()).filter(Boolean) || []);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const salvar = async () => {
    setSalvando(true);
    try {
      const result = await atualizarEscopoVendedorAdmin(vendedor.id, { normas, servicos, estados });
      setMensagem(result.success ? "Escopo atualizado." : result.error || "Não foi possível salvar.");
    } catch { setMensagem("Não foi possível salvar. Tente novamente."); }
    finally { setSalvando(false); }
  };
  return <details style={{ margin: "16px 0" }}><summary style={{ cursor: "pointer" }}>Editar escopo autorizado</summary>
    <p>Confira os certificados antes de autorizar novas normas.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
      {ISOS_DISPONIVEIS.map(({ label }) => <label key={label}><input type="checkbox" checked={normas.includes(label)} onChange={() => setNormas((items) => items.includes(label) ? items.filter((item) => item !== label) : [...items, label])} /> {label}</label>)}
    </div>
    <EscopoEditor servicos={servicos} estados={estados} onServicos={setServicos} onEstados={setEstados} />
    <button disabled={salvando} onClick={salvar} style={{ background: "#00EBCB", padding: "10px 20px", borderRadius: 8 }}>{salvando ? "Salvando..." : "Salvar escopo autorizado"}</button>
    <p role="status">{mensagem}</p>
  </details>;
}
