# Deploy no Render.com — Dani Blues Estoque

Este projeto é um app Node.js + Express com Postgres, servindo um SPA de `public/index.html`.

## Passo a passo (Blueprint com `render.yaml`)

1. Suba este projeto no GitHub **sem** `node_modules` e **sem** `.env`.
2. Crie conta no [Render](https://render.com) e conecte seu GitHub.
3. Clique em **New** → **Blueprint** → selecione o repositório com este arquivo `render.yaml`.
4. O Render vai criar:
   - **Web Service** (Docker) usando `Dockerfile`.
   - **PostgreSQL** gerenciado e configurar `DATABASE_URL` automaticamente no serviço.
5. Aguarde o deploy terminar e acesse a URL pública (ex.: `https://SEUAPP.onrender.com`).

### Inicializar o banco
Após criar o Postgres, rode o schema uma vez:

**Opção A — pelo Shell do serviço web (Render)**  
Abra *Shell* no serviço e rode:
```bash
psql "$DATABASE_URL" -f schema.sql
```

**Opção B — pela sua máquina (psql local):**
- Pegue o `External Connection` do Postgres no painel do Render.
- Rode:
```bash
psql "postgres://usuario:senha@host:5432/db" -f schema.sql
```

## Atualizações
Faça `git push` no repositório → o Render executa novo deploy automaticamente.

## Notas
- O app escuta `process.env.PORT || 3000`, compatível com Render.
- Não suba `.env` no repositório.
