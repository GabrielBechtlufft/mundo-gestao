export const ISOS_DISPONIVEIS = [
  // Normas certificáveis – Sistemas de Gestão
  { label: "ISO 9001",         sub: "Sistema de Gestão da Qualidade" },
  { label: "ISO 14001",        sub: "Sistema de Gestão Ambiental" },
  { label: "ISO 45001",        sub: "Saúde e Segurança Ocupacional" },
  { label: "ISO/IEC 27001",    sub: "Segurança da Informação" },
  { label: "ISO 22000",        sub: "Segurança de Alimentos" },
  { label: "ISO 50001",        sub: "Gestão de Energia" },
  { label: "ISO 22301",        sub: "Continuidade de Negócios" },
  { label: "ISO 37001",        sub: "Antissuborno" },
  { label: "ISO 37301",        sub: "Compliance" },
  { label: "ISO 39001",        sub: "Segurança Viária" },
  { label: "ISO 41001",        sub: "Facility Management" },
  { label: "ISO/IEC 42001",    sub: "Inteligência Artificial" },
  { label: "ISO 44001",        sub: "Relacionamentos Colaborativos" },
  { label: "ISO 46001",        sub: "Eficiência Hídrica" },
  { label: "ISO 21001",        sub: "Organizações Educacionais" },
  { label: "ISO 20121",        sub: "Sustentabilidade de Eventos" },
  { label: "ISO 21401",        sub: "Sustentabilidade para Hospedagem" },
  { label: "ISO 21101",        sub: "Segurança Turismo de Aventura" },
  { label: "ISO 35001",        sub: "Biorrisco para Laboratórios" },
  { label: "ISO 37101",        sub: "Desenvolvimento Sustentável" },
  { label: "ISO 7101",         sub: "Qualidade em Saúde" },
  { label: "ISO 13485",        sub: "Dispositivos Médicos" },
  { label: "ISO/IEC 20000-1",  sub: "Serviços de TI" },
  { label: "ISO 22163",        sub: "Setor Ferroviário" },
  { label: "ISO 28000",        sub: "Cadeia de Suprimentos" },
  { label: "ISO 55001",        sub: "Gestão de Ativos" },
  { label: "ISO 56001",        sub: "Gestão da Inovação" },
  // Diretrizes e Guias
  { label: "ISO 31000",        sub: "Gestão de Riscos" },
  { label: "IEC 31010",        sub: "Avaliação de Riscos" },
  { label: "ISO 19011",        sub: "Auditoria de SGS" },
  { label: "ISO 9004",         sub: "Sucesso Sustentado" },
  { label: "ISO 14004",        sub: "Gestão Ambiental – Diretrizes" },
  { label: "ISO 45002",        sub: "Implementação da ISO 45001" },
  { label: "ISO 45003",        sub: "Saúde Psicológica no Trabalho" },
  { label: "ISO 37002",        sub: "Gestão de Denúncias" },
  { label: "ISO 37003",        sub: "Controle de Fraude" },
  { label: "ISO 44002",        sub: "Implementação da ISO 44001" },
  { label: "ISO 56002",        sub: "Inovação – Diretrizes" },
  { label: "ISO 56003",        sub: "Inovação – Parcerias" },
  { label: "ISO 56005",        sub: "Propriedade Intelectual" },
  { label: "ISO 56006",        sub: "Inteligência Estratégica" },
  { label: "ISO 56007",        sub: "Oportunidades e Ideias" },
  { label: "ISO 56008",        sub: "Medição das Operações" },
  { label: "ISO 37120",        sub: "Cidades – Indicadores Urbanos" },
  { label: "ISO 37122",        sub: "Cidades Inteligentes" },
  { label: "ISO 37123",        sub: "Cidades Resilientes" },
  { label: "ISO 37125",        sub: "Cidades – Indicadores ESG" },
  // Outros referenciais
  { label: "IATF 16949",       sub: "Qualidade Automotiva" },
  { label: "VDA 6.3",          sub: "Auditoria de Processo Automotivo" },
  { label: "FSSC 22000",       sub: "Certificação de Segurança Alimentar" },
  { label: "PBQP-H / SiAC",   sub: "Avaliação – Serviços e Obras" },
  { label: "ISO/IEC 17025",    sub: "Laboratórios de Ensaio e Calibração" },
  { label: "Outras",           sub: "Outras normas" },
];


export const TIPOS_SERVICO = [
  { label: "Certificação", icon: "🏆", desc: "Obtenção e transferência de certificados ISO" },
  { label: "Consultoria",  icon: "💼", desc: "Apoio especializado para certificação e manutenção" },
  { label: "Treinamento",  icon: "📚", desc: "Capacitação técnica e formação de auditores" },
  { label: "Auditoria",    icon: "🔍", desc: "Auditorias internas e em fornecedores" },
];

export const CATEGORIAS_SERVICO: Record<string, string[]> = {
  "Certificação": ["Nova Certificação", "Transferência de Certificação"],
  "Consultoria":  ["Consultoria para Nova Certificação", "Consultoria para Manutenção da Certificação"],
  "Treinamento":  ["Interpretação da Norma", "Auditor Interno", "Auditor Líder"],
  "Auditoria":    ["Auditoria Interna", "Auditoria em Fornecedores"],
};

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

export const TODOS_ESTADOS = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
];
