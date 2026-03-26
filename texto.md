# Relatório de entrega – NEADH IEMA PLENO CAROLINA

Este documento explica como o site foi construído, quais tecnologias foram usadas e como o fluxo funciona do ponto de vista do usuário e do painel administrativo.

## Visão geral

O projeto é uma plataforma web de conscientização sobre bullying escolar (com foco no enfrentamento ao racismo) e inclui um canal de denúncia com painel administrativo para gestão dos registros. A arquitetura é simples e eficiente: frontend estático + API serverless + banco MongoDB.

## Tecnologias e ferramentas utilizadas

- HTML5, CSS3 e JavaScript (Vanilla) no frontend.
- Node.js para execução das funções serverless.
- MongoDB (driver oficial `mongodb`) para persistência dos dados.
- Vercel Functions (pasta `api/`) para endpoints `POST` e `GET`.
- PWA no painel administrativo (`admin-manifest.webmanifest` + `admin-sw.js`).
- Scripts utilitários para imagens (`scripts/optimize-images.mjs` e `scripts/generate-og-cover.mjs`).

## Estrutura principal do projeto

- `index.html`, `styles.css`, `main.js`: site público, conteúdo e formulário.
- `admin.html`, `admin.css`, `admin.js`: painel administrativo.
- `api/reports.js`: API serverless (registro e listagem de denúncias).
- `lib/mongodb.js`: conexão compartilhada com o MongoDB.
- `assets/`: imagens, ícones e capas sociais.

## Fluxo do site (usuário)

1. O visitante acessa `/` e navega pelas seções educativas.
2. No formulário, preenche a denúncia em etapas (campos obrigatórios e opcionais).
3. `main.js` valida os dados e envia um `POST /api/reports`.
4. A API valida a solicitação, grava no MongoDB e gera um protocolo único.
5. O site exibe a confirmação e o número de protocolo ao usuário.

## Fluxo do painel administrativo

1. O diretor acessa `/admin`.
2. O painel exige a chave administrativa (`ADMIN_PANEL_KEY`).
3. O painel chama `GET /api/reports?limit=200` com o header `x-admin-key`.
4. A API valida a chave e retorna as denúncias mais recentes.
5. O painel renderiza a lista com protocolo, data, tipo, status, descrição e contatos (quando informados).

## API (resumo)

- `POST /api/reports`: registra denúncias com `tipo`, `descricao`, `nome`, `contato` e `consentimento`.
- `GET /api/reports?limit=200`: lista denúncias, protegido por chave.

## Persistência e segurança

- As denúncias são armazenadas no MongoDB (coleção configurável por variável de ambiente).
- Existe validação no frontend e no backend.
- O painel é protegido por chave de acesso.
- A API registra metadados técnicos (IP e user-agent) para auditoria básica.

## PWA do painel

O painel pode ser instalado como aplicativo em dispositivos móveis e desktop. O `service worker` mantém os assets do painel em cache, garantindo abertura rápida, enquanto os dados são sempre buscados na rede.

## Como executar e fazer deploy

- `npm install` para instalar dependências.
- Configurar variáveis de ambiente no `.env` ou no provedor (ex.: Vercel).
- Deploy recomendado na Vercel, que suporta funções serverless nativamente.

## Variáveis de ambiente

- `MONGODB_URI`
- `MONGODB_DB` (padrão: `neadh_iema`)
- `MONGODB_COLLECTION` (padrão: `denuncias`)
- `ADMIN_PANEL_KEY`

## Observações finais

O site está pronto para uso institucional, com fluxo completo de denúncia, registro e acompanhamento. Para ambientes com alto volume ou exigências legais mais rígidas, pode-se evoluir com autenticação avançada, rate limit e auditoria mais detalhada.
