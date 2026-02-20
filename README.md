# NEADH IEMA
Plataforma web de conscientização sobre bullying escolar (com foco no enfrentamento ao racismo), com canal de denúncia e painel administrativo para gestão dos registros.

## Objetivo do projeto
Este site foi criado para apoiar estudantes, famílias e educadores no combate ao bullying e ao racismo no ambiente escolar.

O projeto oferece:
- Conteúdo educativo e orientações práticas.
- Formulário de denúncia em etapas.
- Registro real das denúncias em banco de dados.
- Painel administrativo para acompanhamento dos casos.
- Versão instalável (PWA) do painel para uso em celular/computador.

## Visão geral da arquitetura
O projeto usa uma arquitetura simples e eficaz:
- Frontend estático em HTML/CSS/JS.
- API serverless para gravação e leitura das denúncias.
- Banco MongoDB para persistência.
- Deploy recomendado na Vercel.

Fluxo principal:
1. Usuário preenche denúncia no site (`index.html`).
2. `main.js` valida o formulário e envia `POST /api/reports`.
3. API valida dados e grava no MongoDB com protocolo único.
4. Diretor acessa `admin.html` e consulta denúncias via `GET /api/reports` com chave administrativa.

## Stack utilizada
- HTML5
- CSS3
- JavaScript (Vanilla)
- Node.js
- MongoDB Driver (`mongodb`)
- Sharp (`sharp`) para otimização/geração de imagens
- Vercel Functions (pasta `api/`)
- PWA (Manifest + Service Worker) no painel administrativo

## Funcionalidades implementadas

## Site público (`index.html`)
- Navegação responsiva (menu hamburguer no mobile).
- Seções educativas sobre tipos de bullying, sinais e condutas.
- Formulário de denúncia em 3 etapas.
- Geração de protocolo para cada envio.
- SEO técnico e social (`Open Graph`, `Twitter Card`, `JSON-LD`).
- Imagens otimizadas com fallback (`webp` + `png`).

## Formulário de denúncia
- Campos obrigatórios: tipo e descrição.
- Campos opcionais: nome e contato.
- Consentimento obrigatório para envio.
- Mensagem de retorno e exibição do número de protocolo.

## Painel do diretor (`admin.html`)
- Acesso por chave administrativa (`ADMIN_PANEL_KEY`).
- Listagem das denúncias mais recentes.
- Exibição de protocolo, tipo, data, status, nome, contato e descrição.
- Botão de atualização da lista.

## PWA do painel
- Painel instalável como app (Android/desktop com prompt; iPhone via “Adicionar à Tela de Início”).
- Arquivos:
  - `admin-manifest.webmanifest`
  - `admin-sw.js`
- Cache de assets estáticos do painel para abertura rápida.
- API permanece em rede (dados sempre atualizados).

## Endpoints da API

## `POST /api/reports`
Registra nova denúncia.

Payload esperado:
```json
{
  "tipo": "Racismo",
  "descricao": "Descrição do caso",
  "nome": "Opcional",
  "contato": "Opcional",
  "consentimento": true
}
```

Resposta de sucesso:
```json
{
  "ok": true,
  "protocol": "NEADH-20260220-ABC123",
  "message": "Denuncia registrada com sucesso."
}
```

## `GET /api/reports?limit=200`
Lista denúncias para o painel administrativo.

Requer header:
- `x-admin-key: <ADMIN_PANEL_KEY>`

Resposta:
```json
{
  "ok": true,
  "total": 12,
  "reports": []
}
```

## Segurança atual
- Chave de acesso no painel (`ADMIN_PANEL_KEY`).
- Validação de campos no frontend e backend.
- Sanitização básica de texto na API.
- Metadados técnicos de requisição (IP e user-agent) armazenados no banco.

Observação:
- Para produção avançada, recomenda-se adicionar autenticação robusta (ex.: login com sessão/JWT), rate limit e auditoria de acesso no painel.

## Estrutura de pastas
```text
.
├── index.html                     # Site público
├── styles.css                     # Estilos do site público
├── main.js                        # Interações do site público e envio do formulário
├── admin.html                     # Painel administrativo
├── admin.css                      # Estilos do painel
├── admin.js                       # Lógica do painel + PWA install prompt
├── admin-manifest.webmanifest     # Manifest PWA do painel
├── admin-sw.js                    # Service Worker PWA do painel
├── api/
│   └── reports.js                 # Endpoint serverless (POST/GET)
├── lib/
│   └── mongodb.js                 # Conexão compartilhada com MongoDB
├── assets/
│   ├── images/                    # Logos e capas sociais
│   └── icons/                     # Ícones do PWA
├── scripts/
│   ├── optimize-images.mjs        # Gera WebP otimizadas
│   └── generate-og-cover.mjs      # Gera og-cover.png/webp
├── package.json
├── .env.example
└── README.md
```

## Variáveis de ambiente
Configure no Vercel (ou `.env` local):

- `MONGODB_URI`: string de conexão MongoDB Atlas.
- `MONGODB_DB`: nome do banco (padrão: `neadh_iema`).
- `MONGODB_COLLECTION`: coleção de denúncias (padrão: `denuncias`).
- `ADMIN_PANEL_KEY`: chave de acesso do painel administrativo.

Exemplo em `.env.example`:
```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=neadh_iema
MONGODB_COLLECTION=denuncias
ADMIN_PANEL_KEY=sua_chave_secreta_aqui
```

## Como executar localmente
Pré-requisitos:
- Node.js 18+
- Conta MongoDB Atlas (ou instância MongoDB acessível)

Passos:
1. Instale dependências:
```bash
npm install
```
2. Crie `.env` com as variáveis necessárias.
3. Rode localmente com sua plataforma de preferência (ex.: `vercel dev`).

Observação:
- Como a API está em `api/`, o fluxo local ideal é via ambiente compatível com funções serverless.

## Deploy na Vercel
1. Conecte o repositório no Vercel.
2. Configure as variáveis de ambiente.
3. Faça deploy.
4. Teste:
- Envio de denúncia em `index.html`
- Leitura no painel `admin.html`
- Instalação do PWA do painel

## Scripts úteis
- `npm run optimize:images` -> gera versões WebP otimizadas.
- `node scripts/generate-og-cover.mjs` -> recria `og-cover.png` e `og-cover.webp`.

## SEO e compartilhamento
O projeto já inclui:
- `canonical`
- `Open Graph`
- `Twitter Card`
- `JSON-LD` (Organization)

Imagem de compartilhamento:
- `assets/images/og-cover.png`
- `assets/images/og-cover.webp`

## Licença e uso institucional
Este projeto foi construído para uso educacional e institucional do NEADH/IEMA.
Para uso em outros contextos, recomenda-se adequar textos, políticas internas e fluxos de atendimento.
