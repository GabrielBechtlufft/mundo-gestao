import { certificadosDoCadastro, stringList } from "@/app/lib/cadastro";

export function Escopo({ servicos, estados }: { servicos?: string | null; estados?: string | null }) {
  return <div style={{ margin: "16px 0" }}>
    <strong>Serviços e categorias</strong>
    <ul>{stringList(servicos).map((item) => <li key={item}>{item.replace("::", " — ")}</li>)}</ul>
    {!stringList(servicos).length && <p>Não informado. Atualize o escopo antes de publicar novas listagens.</p>}
    {estados && <p><strong>Estados de atuação:</strong> {stringList(estados).join(", ") || "Não informado"}</p>}
  </div>;
}

export default function Certificados({ value }: { value?: string | null }) {
  const certificados = certificadosDoCadastro(value);
  return <div style={{ margin: "16px 0" }}><strong>Certificados anexados</strong>
    {!certificados.length && <p>Nenhum certificado disponível.</p>}
    {certificados.map((cert) => <p key={cert.iso}>
      <strong>{cert.iso}</strong> · Validade: {cert.validade || "Não informada"}
      {cert.documento && /^(https:\/\/|\/uploads\/)/.test(cert.documento) && <> · <a href={cert.documento} target="_blank" rel="noopener noreferrer" style={{ color: "#00A9D6" }}>Visualizar certificado</a></>}
    </p>)}
  </div>;
}
