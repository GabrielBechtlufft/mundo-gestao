"use client";
import { CATEGORIAS_SERVICO, ESTADOS } from "@/app/lib/estados";

export default function EscopoEditor({ servicos, estados, onServicos, onEstados }: {
  servicos: string[]; estados: string[];
  onServicos: (value: string[]) => void; onEstados: (value: string[]) => void;
}) {
  const toggle = (items: string[], item: string) => items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
  return <fieldset style={{ border: "1px solid #64748B", borderRadius: 12, padding: 16, margin: "20px 0" }}>
    <legend>Serviços, categorias e estados de atuação</legend>
    <p>Novas listagens passam pela aprovação do Admin. Ofertas fora do escopo informado serão suspensas para revisão.</p>
    {Object.entries(CATEGORIAS_SERVICO).map(([tipo, categorias]) => <div key={tipo} style={{ marginBottom: 12 }}>
      <strong>{tipo}</strong>
      {categorias.map((categoria) => { const value = `${tipo}::${categoria}`; return <label key={value} style={{ display: "block", marginTop: 6 }}>
        <input type="checkbox" checked={servicos.includes(value)} onChange={() => onServicos(toggle(servicos, value))} /> {categoria}
      </label>; })}
    </div>)}
    <strong>Estados</strong>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8, marginTop: 8 }}>
      {ESTADOS.map((estado) => <label key={estado}><input type="checkbox" checked={estados.includes(estado)} onChange={() => onEstados(toggle(estados, estado))} /> {estado}</label>)}
    </div>
  </fieldset>;
}
