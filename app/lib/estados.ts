export const ISOS_DISPONIVEIS = [
  { label: "ISO 9001",  sub: "Qualidade" },
  { label: "ISO 14001", sub: "Meio Ambiente" },
  { label: "ISO 45001", sub: "Saúde e Segurança" },
  { label: "ISO 27001", sub: "Segurança da Informação" },
  { label: "ISO 37001", sub: "Antissuborno" },
  { label: "ISO 50001", sub: "Energia" },
  { label: "ISO 22000", sub: "Alimentos" },
  { label: "ISO 17025", sub: "Laboratórios" },
];

export const ESTADOS_CIDADES: Record<string, string[]> = {
  "AL — Alagoas":              ["Maceió"],
  "AM — Amazonas":             ["Manaus"],
  "BA — Bahia":                ["Salvador"],
  "CE — Ceará":                ["Fortaleza"],
  "DF — Distrito Federal":     ["Brasília"],
  "ES — Espírito Santo":       ["Vitória"],
  "GO — Goiás":                ["Goiânia"],
  "MG — Minas Gerais":         ["Belo Horizonte", "Uberlândia"],
  "PA — Pará":                 ["Belém"],
  "PB — Paraíba":              ["João Pessoa"],
  "PE — Pernambuco":           ["Recife"],
  "PR — Paraná":               ["Curitiba"],
  "RJ — Rio de Janeiro":       ["Rio de Janeiro"],
  "RN — Rio Grande do Norte":  ["Natal"],
  "RS — Rio Grande do Sul":    ["Porto Alegre"],
  "SC — Santa Catarina":       ["Florianópolis"],
  "SP — São Paulo":            ["Campinas", "Guarulhos", "Osasco", "Ribeirão Preto", "Santo André", "São Bernardo do Campo", "São Paulo", "Sorocaba"],
};

export const ESTADOS = Object.keys(ESTADOS_CIDADES).sort();
