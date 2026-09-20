<div align="center">

# 🚗 MyCar

### Sistema de gestão para oficina mecânica

Controle clientes, veículos, ordens de serviço e manutenções em um só lugar.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

**Frontend** · [Ver API (Laravel)](https://github.com/joaoalexandre2/mycar)

</div>

<div align="center">
  <img src="docs/login.png" alt="Tela de login do MyCar" width="720">
</div>

---

## ✨ Funcionalidades

| | |
|---|---|
| 🔐 **Login** | Autenticação por token e rotas protegidas |
| 📊 **Dashboard** | Resumo geral da oficina |
| 👥 **Clientes** | Cadastro, edição e busca com paginação |
| 🚙 **Veículos** | Veículos vinculados a cada cliente |
| 🧾 **Ordens de serviço** | Abertura, acompanhamento e fechamento |
| 🔧 **Manutenções** | Histórico e próximas revisões |
| ⚙️ **Configurações** | Ajustes da conta |

## 🧩 Como funciona

```mermaid
flowchart LR
    U([👤 Usuário]) --> F[⚛️ Frontend<br/>React + Vite]
    F -- "HTTP + token" --> A[🐘 API Laravel]
    A --> D[(🗄️ Banco de dados)]
```

```mermaid
flowchart TD
    L[/login/] -->|token válido| R{Rota protegida}
    R --> D[Dashboard]
    R --> C[Clientes]
    R --> V[Veículos]
    R --> O[Ordens de serviço]
    R --> M[Manutenções]
    R --> S[Configurações]
```

## 🚀 Começando

### Pré-requisitos

- Node.js 20+
- [API MyCar](https://github.com/joaoalexandre2/mycar) rodando (padrão: `http://localhost:8000`)

### Instalação

```bash
git clone https://github.com/joaoalexandre2/mycar_frontend.git
cd mycar_frontend
npm install
```

Crie um arquivo `.env` na raiz:

```env
VITE_API_URL=http://localhost:8000/api
```

> Se `VITE_API_URL` não for definida, o padrão é `http://localhost:8000/api`.

### Executando

```bash
npm run dev
```

## 📜 Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos + build de produção |
| `npm run preview` | Pré-visualiza o build |
| `npm run lint` | Roda o ESLint |
| `npm test` | Roda os testes uma vez |
| `npm run test:watch` | Testes em modo watch |

## 🗺️ Rotas

| Rota | Tela |
|---|---|
| `/login` | Login |
| `/` | Dashboard |
| `/clientes` | Clientes |
| `/veiculos` | Veículos |
| `/ordens-servico` | Ordens de serviço |
| `/manutencoes` | Manutenções |
| `/configuracoes` | Configurações |

## 📁 Estrutura

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

## 🔗 Backend

A API está em [joaoalexandre2/mycar](https://github.com/joaoalexandre2/mycar).

---

<div align="center">
Feito com ☕ por <a href="https://github.com/joaoalexandre2">João Alexandre</a>
</div>
