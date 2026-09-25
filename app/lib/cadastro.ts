import { CATEGORIAS_SERVICO, ESTADOS, ISOS_DISPONIVEIS } from "./estados";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const SENHA_FORTE = /^(?=.{8,128}$)(?=.*[A-Za-z])(?=.*\d).*$/;
const LOCAL_UPLOAD = /^\/uploads\/[0-9a-f-]{36}\.(pdf|png|jpe?g|webp)$/i;
const BLOB_UPLOAD = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/[0-9a-f-]{36}\.(pdf|png|jpe?g|webp)$/i;

export function arquivoValido(url: unknown, imagem = false): url is string {
  return typeof url === "string" && (LOCAL_UPLOAD.test(url) || BLOB_UPLOAD.test(url)) &&
    (!imagem || /\.(png|jpe?g|webp)$/i.test(url));
}

export function formatPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (value.trim().startsWith("+55") || (digits.startsWith("55") && digits.length > 11)) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `+55 (${digits}`;
  if (digits.length <= 3) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function stringList(raw: string | null | undefined): string[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
  } catch { return []; }
}

export function escoposValidos(escopos: string[]) {
  return escopos.length > 0 && escopos.every((escopo) => {
    const [tipo, categoria, extra] = escopo.split("::");
    return !extra && CATEGORIAS_SERVICO[tipo]?.includes(categoria);
  });
}

export type Certificado = { iso: string; validade: string; documento: string };
export function certificadosDoCadastro(raw: string | null | undefined): Certificado[] {
  try {
    const value: unknown = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object") return [];
    const entries = Array.isArray(value) ? value.map((item) => [item?.iso, item]) : Object.entries(value);
    return entries.flatMap(([iso, item]) => {
      if (typeof iso !== "string" || !item || typeof item !== "object") return [];
      const cert = item as Record<string, unknown>;
      return [{ iso, validade: typeof cert.validade === "string" ? cert.validade : "", documento: typeof cert.documento === "string" ? cert.documento : typeof cert.arquivoUrl === "string" ? cert.arquivoUrl : "" }];
    });
  } catch { return []; }
}

export function validarEscopo(estado: string, escopos: string[], normas: string[]) {
  if (!ESTADOS.includes(estado)) return "Selecione um estado válido.";
  if (!escoposValidos(escopos)) return "Selecione serviços e categorias válidos.";
  if (!normas.length || normas.some((iso) => !ISOS_DISPONIVEIS.some((item) => item.label === iso))) return "Selecione normas válidas.";
  return null;
}

export function validarCertificados(raw: string | undefined, normas: string[]) {
  const certificados = certificadosDoCadastro(raw);
  if (certificados.length !== normas.length || new Set(certificados.map((c) => c.iso)).size !== normas.length) return false;
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  return certificados.every((c) => {
    const data = new Date(`${c.validade}T12:00:00Z`);
    return normas.includes(c.iso) && arquivoValido(c.documento) && /^\d{4}-\d{2}-\d{2}$/.test(c.validade) &&
      Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === c.validade && c.validade >= hoje;
  });
}

export function listagemNoEscopo(listagem: {
  isoTipo: string; estado: string; tipoServico: string | null; categoriaServico: string | null;
  User: { isosVendidas: string; servicosCategorias: string; estadosAtuacao: string; statusVendedor: string } | null;
}) {
  const user = listagem.User;
  return !!user && user.statusVendedor === "APROVADO" &&
    user.isosVendidas.split(",").map((iso) => iso.trim()).includes(listagem.isoTipo) &&
    stringList(user.servicosCategorias).includes(`${listagem.tipoServico}::${listagem.categoriaServico}`) &&
    stringList(user.estadosAtuacao).includes(listagem.estado);
}
