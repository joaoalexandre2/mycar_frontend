# MyCar Frontend

Interface web para gerenciar uma oficina mecânica: clientes, veículos, ordens de serviço e manutenções. Consome a [API MyCar](https://github.com/joaoalexandre2/mycar) feita em Laravel.

## Tecnologias

- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Axios
- Lucide React (ícones)
- Vitest + Testing Library

## Funcionalidades

- Login com autenticação por token e rotas protegidas
- Dashboard com resumo
- CRUD de clientes, veículos, ordens de serviço e manutenções, com paginação
- Tela de configurações

## Pré-requisitos

- Node.js 20+
- API MyCar rodando (por padrão em `http://localhost:8000`)

## Instalação

```bash
git clone https://github.com/joaoalexandre2/mycar_frontend.git
cd mycar_frontend
npm install
```

Crie um arquivo `.env` na raiz apontando para a API:

```env
VITE_API_URL=http://localhost:8000/api
```

Se `VITE_API_URL` não for definida, o padrão é `http://localhost:8000/api`.

## Executando

```bash
npm run dev
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos e build de produção |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | Roda o ESLint |
| `npm test` | Roda os testes uma vez |
| `npm run test:watch` | Testes em modo watch |

## Rotas

| Rota | Tela |
|---|---|
| `/login` | Login |
| `/` | Dashboard |
| `/clientes` | Clientes |
| `/veiculos` | Veículos |
| `/ordens-servico` | Ordens de serviço |
| `/manutencoes` | Manutenções |
| `/configuracoes` | Configurações |

## Estrutura

```
src/
├── components/   # auth, dashboard e layout
├── contexts/     # AuthContext
├── hooks/        # useAuth
├── pages/        # telas da aplicação
├── services/     # chamadas à API (axios)
├── types/        # tipos TypeScript
└── utils/
```

## Backend

A API fica em [joaoalexandre2/mycar](https://github.com/joaoalexandre2/mycar).
