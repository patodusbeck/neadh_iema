# neadh_iema
Núcleo de Educação Antirracista e em Direitos Humanos

## Backend de denúncias (MongoDB)
O formulário envia para `POST /api/reports` (função serverless) e salva no MongoDB.

## Painel do diretor
Acesse `admin.html` para visualizar as denúncias enviadas.
O painel funciona como PWA instalável (app) em navegadores compatíveis.

## Variáveis de ambiente
Crie as variáveis no Vercel (ou em `.env` local):

- `MONGODB_URI`: string de conexão do MongoDB Atlas.
- `MONGODB_DB` (opcional): nome do banco. Padrão: `neadh_iema`.
- `MONGODB_COLLECTION` (opcional): nome da coleção. Padrão: `denuncias`.
- `ADMIN_PANEL_KEY`: chave secreta para acessar listagem no painel administrativo.

## Scripts
- `npm install`
- `npm run optimize:images`
- `node scripts/generate-og-cover.mjs`

## PWA do painel
Para instalar o app do painel:
1. Acesse `https://neadhiema.vercel.app/admin.html`.
2. Clique em `Instalar app` (quando disponível) ou use a opção de instalar do navegador.
