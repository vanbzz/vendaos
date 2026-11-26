# VendaOS · Estúdio de copy

Gênesis organiza investigação, desenho e aprovação de ofertas. Mercúrio cria anúncios de prova, Aurora iscas, Íris copy de quiz, Apolo VSL (LHTCO), Hélio lançamentos de infoprodutos, Órion lançamentos SaaS, Atena mentorias e Lira webinars.

## Execução

Node 22.13+ e `npm run dev`. Vinext/Sites, autenticação ChatGPT e D1. A chave `OPENAI_API_KEY` permanece no segredo de produção e em `.env.local` ignorado. Investigação e oferta usam `OPENAI_MODEL` (padrão gpt-4.1-mini). Os oito criadores usam `OPENAI_COPY_MODEL`, com fallback para `OPENAI_CREATOR_MODEL` e gpt-6-astra, raciocínio médio e streaming. Respostas não são armazenadas na API.

## Experiência e dados

- Interface branca, navegação lateral, nove retratos originais e briefings guiados.
- Oferta aprovada com assinatura vinculada ao usuário. Mudanças exigem nova aprovação.
- Documentos editáveis, copiar/baixar Markdown, biblioteca e refinamento com três versões anteriores.
- Salvamento na conta com cópia local, controle de revisão e recuperação de conflitos. Exportação/importação JSON.
- Projetos existentes e artefatos antigos permanecem no esquema e exportação. Criação visual e upload de referências foram encerrados (410). Downloads de referências antigas continuam restritos ao dono.
- Copy e planejamento somente: o sistema não envia anúncios ou mensagens, não publica páginas nem executa lançamentos.
- Fatos e provas faltantes são marcados, não inventados. Planos e condições propostas requerem revisão.
- Atena pode propor nova mentoria a partir da expertise, sem mudar a oferta aprovada de origem.
- Limite por usuário/instância: 12 gerações de copy a cada dez minutos. Não é um limite global de cobrança.
- Máximo de 16 documentos por projeto. Projetos e histórico são preservados ao refinar.

## Verificação

`node node_modules/typescript/bin/tsc --noEmit`

Build/pacote pelo helper oficial Sites. Testes de IA usam dados sintéticos; arquivos de QA ficam fora da fonte publicada.

## Desenvolvimento a partir do GitHub

Este repositório contém uma cópia do código da versão 7 do VendaOS, incluindo o modo de visita pública. Origem: commit `56375b0613ba5bae4e0a836edb5aa55546f2186d` do projeto Sites. O histórico anterior, segredos e dados de usuários não foram incluídos.

```bash
git clone https://github.com/vanbzz/vendaos.git
cd vendaos
npm run install:ci
cp .env.example .env.local
npm run dev
```

Abra a URL local exibida no terminal (por padrão, http://localhost:5173). A página inicial funciona em modo visita. Em desenvolvimento local, o botão Entrar usa uma identidade de teste, sem acessar a conta ou os dados de produção. Para gerar textos, configure sua própria `OPENAI_API_KEY` em `.env.local` e modelos disponíveis na sua conta. O acesso ao código não inclui créditos de API.

### Banco de dados e hospedagem

A aplicação utiliza Cloudflare Workers, D1 (`DB`) e R2 (`BUCKET`), com esquema e migrações em `db/` e `drizzle/`. O salvamento na conta depende de um banco com essas migrações aplicadas. Os bancos e arquivos de produção não estão neste repositório.

`npm run build` gera o pacote local. A publicação em produção é feita separadamente pelo Sites; enviar commits ao GitHub não publica o site automaticamente. `.openai/hosting.json` identifica o projeto original: coordene alterações de produção com o proprietário. Em outra hospedagem, será necessário configurar os recursos Cloudflare e adaptar a autenticação ChatGPT, que depende da infraestrutura Sites. Os cabeçalhos de identidade devem vir de um gateway autenticado e confiável.

### Organização

- `app/PublicStudio.tsx`: visita sem login.
- `app/Tool.tsx`: estúdio e projetos.
- `app/api/`: geração, projetos e referências legadas.
- `lib/creators.ts` e `lib/copy-prompts.ts`: criadores, briefings e instruções.
- `public/creators/`: retratos dos nove criadores.
- `app/globals.css`: identidade visual.

Mantenha chaves e dados reais fora dos commits. O repositório é privado e não concede uma licença pública de uso; licenças de dependências e arquivos de terceiros permanecem nos respectivos arquivos.
