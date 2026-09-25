-- Mapeia apenas estados e cidades conhecidos do catálogo anterior.
-- Dados desconhecidos ficam preservados para revisão administrativa.
BEGIN;
CREATE TEMP TABLE estado_legado (alias TEXT PRIMARY KEY, estado TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO estado_legado VALUES
('al — alagoas', 'AL — Alagoas'),
('al', 'AL — Alagoas'),
('alagoas', 'AL — Alagoas'),
('maceio', 'AL — Alagoas'),
('am — amazonas', 'AM — Amazonas'),
('am', 'AM — Amazonas'),
('amazonas', 'AM — Amazonas'),
('manaus', 'AM — Amazonas'),
('ba — bahia', 'BA — Bahia'),
('ba', 'BA — Bahia'),
('bahia', 'BA — Bahia'),
('salvador', 'BA — Bahia'),
('ce — ceara', 'CE — Ceará'),
('ce', 'CE — Ceará'),
('ceara', 'CE — Ceará'),
('fortaleza', 'CE — Ceará'),
('df — distrito federal', 'DF — Distrito Federal'),
('df', 'DF — Distrito Federal'),
('distrito federal', 'DF — Distrito Federal'),
('brasilia', 'DF — Distrito Federal'),
('es — espirito santo', 'ES — Espírito Santo'),
('es', 'ES — Espírito Santo'),
('espirito santo', 'ES — Espírito Santo'),
('vitoria', 'ES — Espírito Santo'),
('go — goias', 'GO — Goiás'),
('go', 'GO — Goiás'),
('goias', 'GO — Goiás'),
('goiania', 'GO — Goiás'),
('mg — minas gerais', 'MG — Minas Gerais'),
('mg', 'MG — Minas Gerais'),
('minas gerais', 'MG — Minas Gerais'),
('belo horizonte', 'MG — Minas Gerais'),
('uberlandia', 'MG — Minas Gerais'),
('pa — para', 'PA — Pará'),
('pa', 'PA — Pará'),
('para', 'PA — Pará'),
('belem', 'PA — Pará'),
('pb — paraiba', 'PB — Paraíba'),
('pb', 'PB — Paraíba'),
('paraiba', 'PB — Paraíba'),
('joao pessoa', 'PB — Paraíba'),
('pe — pernambuco', 'PE — Pernambuco'),
('pe', 'PE — Pernambuco'),
('pernambuco', 'PE — Pernambuco'),
('recife', 'PE — Pernambuco'),
('pr — parana', 'PR — Paraná'),
('pr', 'PR — Paraná'),
('parana', 'PR — Paraná'),
('curitiba', 'PR — Paraná'),
('rj — rio de janeiro', 'RJ — Rio de Janeiro'),
('rj', 'RJ — Rio de Janeiro'),
('rio de janeiro', 'RJ — Rio de Janeiro'),
('rn — rio grande do norte', 'RN — Rio Grande do Norte'),
('rn', 'RN — Rio Grande do Norte'),
('rio grande do norte', 'RN — Rio Grande do Norte'),
('natal', 'RN — Rio Grande do Norte'),
('rs — rio grande do sul', 'RS — Rio Grande do Sul'),
('rs', 'RS — Rio Grande do Sul'),
('rio grande do sul', 'RS — Rio Grande do Sul'),
('porto alegre', 'RS — Rio Grande do Sul'),
('sc — santa catarina', 'SC — Santa Catarina'),
('sc', 'SC — Santa Catarina'),
('santa catarina', 'SC — Santa Catarina'),
('florianopolis', 'SC — Santa Catarina'),
('sp — sao paulo', 'SP — São Paulo'),
('sp', 'SP — São Paulo'),
('sao paulo', 'SP — São Paulo'),
('campinas', 'SP — São Paulo'),
('guarulhos', 'SP — São Paulo'),
('osasco', 'SP — São Paulo'),
('ribeirao preto', 'SP — São Paulo'),
('santo andre', 'SP — São Paulo'),
('sao bernardo do campo', 'SP — São Paulo'),
('sorocaba', 'SP — São Paulo'),
('ac — acre', 'AC — Acre'),
('ac', 'AC — Acre'),
('acre', 'AC — Acre'),
('rio branco', 'AC — Acre'),
('ap — amapa', 'AP — Amapá'),
('ap', 'AP — Amapá'),
('amapa', 'AP — Amapá'),
('macapa', 'AP — Amapá'),
('ro — rondonia', 'RO — Rondônia'),
('ro', 'RO — Rondônia'),
('rondonia', 'RO — Rondônia'),
('porto velho', 'RO — Rondônia'),
('rr — roraima', 'RR — Roraima'),
('rr', 'RR — Roraima'),
('roraima', 'RR — Roraima'),
('boa vista', 'RR — Roraima'),
('to — tocantins', 'TO — Tocantins'),
('to', 'TO — Tocantins'),
('tocantins', 'TO — Tocantins'),
('palmas', 'TO — Tocantins'),
('ma — maranhao', 'MA — Maranhão'),
('ma', 'MA — Maranhão'),
('maranhao', 'MA — Maranhão'),
('sao luis', 'MA — Maranhão'),
('pi — piaui', 'PI — Piauí'),
('pi', 'PI — Piauí'),
('piaui', 'PI — Piauí'),
('teresina', 'PI — Piauí'),
('se — sergipe', 'SE — Sergipe'),
('se', 'SE — Sergipe'),
('sergipe', 'SE — Sergipe'),
('aracaju', 'SE — Sergipe'),
('mt — mato grosso', 'MT — Mato Grosso'),
('mt', 'MT — Mato Grosso'),
('mato grosso', 'MT — Mato Grosso'),
('cuiaba', 'MT — Mato Grosso'),
('ms — mato grosso do sul', 'MS — Mato Grosso do Sul'),
('ms', 'MS — Mato Grosso do Sul'),
('mato grosso do sul', 'MS — Mato Grosso do Sul'),
('campo grande', 'MS — Mato Grosso do Sul');

UPDATE "Listagem" l SET "estado" = e.estado
FROM estado_legado e
WHERE lower(translate(btrim(COALESCE(NULLIF(l."estado", ''), l."cidade")), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç', 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')) = e.alias;
UPDATE "SolicitacaoCadastro" s SET "estado" = e.estado
FROM estado_legado e
WHERE lower(translate(btrim(COALESCE(NULLIF(s."estado", ''), s."cidade")), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç', 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')) = e.alias;
ALTER TABLE "Listagem" ALTER COLUMN "cidade" SET DEFAULT '';

-- Normaliza também arrays preenchidos por versões anteriores do cadastro.
CREATE FUNCTION pg_temp.estados_json(value TEXT) RETURNS JSONB LANGUAGE plpgsql AS $$
BEGIN
 IF jsonb_typeof(value::jsonb) = 'array' THEN RETURN value::jsonb; END IF;
 RETURN '[]'::jsonb;
EXCEPTION WHEN invalid_text_representation THEN RETURN '[]'::jsonb;
END;
$$;
UPDATE "User" u SET "estadosAtuacao" = (
 SELECT jsonb_agg(DISTINCT COALESCE(e.estado, item))::text
 FROM jsonb_array_elements_text(pg_temp.estados_json(u."estadosAtuacao")) item
 LEFT JOIN estado_legado e ON e.alias = lower(translate(btrim(item), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç', 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'))
) WHERE jsonb_array_length(pg_temp.estados_json(u."estadosAtuacao")) > 0;

-- A pausa antiga não diferencia decisão do administrador da certificadora.
-- Exige revisão do Admin antes de republicar, preservando remoções e rejeições.
UPDATE "Listagem" SET "status" = 'SUSPENSA_ADMIN' WHERE "status" = 'PAUSADA';

WITH aprovadas AS (
 SELECT DISTINCT ON (lower(email)) * FROM "SolicitacaoCadastro"
 WHERE status = 'APROVADO' ORDER BY lower(email), "createdAt" DESC, id DESC
)
UPDATE "User" u SET
 "logo" = COALESCE(u."logo", s."logo"),
 "certificacoesISO" = COALESCE(NULLIF(u."certificacoesISO", ''), NULLIF(s."certificacoesISO", ''),
   CASE WHEN NULLIF(s."documentoComprovante", '') IS NOT NULL THEN
    (SELECT jsonb_agg(jsonb_build_object('iso', btrim(iso), 'validade', COALESCE(s."validadeCertificado", ''), 'documento', s."documentoComprovante"))::text
     FROM unnest(string_to_array(s."isosVendidas", ',')) iso WHERE btrim(iso) <> '') END),
 "servicosCategorias" = COALESCE(NULLIF(u."servicosCategorias", ''), s."servicosCategorias", ''),
 "estadosAtuacao" = CASE WHEN u."estadosAtuacao" IN ('', '[]') AND EXISTS (SELECT 1 FROM estado_legado e WHERE e.estado = s.estado)
   THEN jsonb_build_array(s.estado)::text ELSE u."estadosAtuacao" END
FROM aprovadas s WHERE lower(u.email) = lower(s.email) AND u.role = 'VENDEDOR';

-- Recupera o escopo de ofertas previamente publicadas quando não havia cadastro.
UPDATE "User" u SET "servicosCategorias" = COALESCE((
 SELECT jsonb_agg(DISTINCT l."tipoServico" || '::' || l."categoriaServico")::text FROM "Listagem" l
 WHERE l."userId" = u.id AND l.status IN ('ATIVA', 'SUSPENSA_ADMIN')
 AND NULLIF(l."tipoServico", '') IS NOT NULL AND NULLIF(l."categoriaServico", '') IS NOT NULL
), '') WHERE u.role = 'VENDEDOR' AND u."servicosCategorias" IN ('', '[]');
UPDATE "User" u SET "estadosAtuacao" = COALESCE((
 SELECT jsonb_agg(DISTINCT l.estado)::text FROM "Listagem" l
 WHERE l."userId" = u.id AND l.status IN ('ATIVA', 'SUSPENSA_ADMIN')
 AND EXISTS (SELECT 1 FROM estado_legado e WHERE e.estado = l.estado)
), '') WHERE u.role = 'VENDEDOR' AND u."estadosAtuacao" IN ('', '[]');
COMMIT;
