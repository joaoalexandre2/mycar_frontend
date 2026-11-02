import { expect, test, type Page } from "@playwright/test";

type Papel = "administrador" | "gestor" | "motorista";

const API = "**/api/**";

/** Pessoa logada da frota, como a API devolve em GET /api/me. */
function usuario(papel: Papel, permissoes: string[] = [], menus: string[] = []) {
  return {
    id: papel === "administrador" ? 1 : papel === "gestor" ? 2 : 3,
    name: `Pessoa ${papel}`,
    email: `${papel}@teste.local`,
    perfil: "frota",
    papel,
    permissoes,
    menus: papel === "motorista" ? menus : ["veiculos", "agenda", "cadastros"],
    admin: false,
    centro_do_motorista: null,
    oficina: null,
    conta: "Frota de teste",
    tema: null,
    cor: null,
    foto: null,
  };
}

/** Entra como a pessoa informada e responde a API com dados vazios, exceto o que a tela precisa. */
async function entrarComo(page: Page, eu: ReturnType<typeof usuario>, extra: Record<string, unknown> = {}) {
  // A sessão fica no localStorage: token e dados da pessoa, como depois de um login.
  await page.addInitScript((sessao) => {
    localStorage.setItem("mycar_token", "token-de-teste");
    localStorage.setItem("mycar_usuario", JSON.stringify(sessao));
  }, eu);

  await page.route(API, async (rota) => {
    const caminho = new URL(rota.request().url()).pathname;

    if (caminho.endsWith("/me")) return rota.fulfill({ json: eu });
    if (caminho in extra) return rota.fulfill({ json: extra[caminho] });
    if (caminho.endsWith("/conta/grupos-usuarios")) {
      // Como o servidor responde: o catálogo de permissões vem na chave `permissoes`.
      return rota.fulfill({ json: { grupos: [], permissoes: {}, menus: {}, usuarios: [] } });
    }

    return rota.fulfill({ json: [] });
  });
}

test("sem login, a gestão da frota leva para a tela de entrar", async ({ page }) => {
  await page.goto("/frota/configuracoes");

  await expect(page).toHaveURL(/\/login/);
});

test("administrador vê a Gestão da frota com todas as abas", async ({ page }) => {
  await entrarComo(page, usuario("administrador", ["centros_custo", "grupos", "motoristas", "usos_corrigir", "usos_importar"]));

  await page.goto("/frota/configuracoes");

  await expect(page.getByRole("heading", { name: "Gestão da frota" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Motivos de troca" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Grupos de usuários" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Pessoas e papéis" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Histórico de acessos" })).toBeVisible();
});

test("gestor vê a Gestão da frota, mas só a aba de motivos de troca", async ({ page }) => {
  await entrarComo(page, usuario("gestor", ["centros_custo", "motoristas", "usos_corrigir", "usos_importar"]));

  await page.goto("/frota/configuracoes");

  await expect(page.getByRole("tab", { name: "Motivos de troca" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Grupos de usuários" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Pessoas e papéis" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Histórico de acessos" })).toHaveCount(0);
});

test("motorista não vê o menu nem consegue abrir a Gestão da frota", async ({ page }) => {
  await entrarComo(page, usuario("motorista"));

  await page.goto("/frota/configuracoes");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /Gestão da frota/ })).toHaveCount(0);
});

test("o seletor de modelos de grupo mostra os modelos salvos pela frota", async ({ page }) => {
  await entrarComo(
    page,
    usuario("administrador", ["centros_custo", "grupos", "motoristas", "usos_corrigir", "usos_importar"]),
    {
      "/api/conta/modelos-grupo": [
        { id: 7, nome: "Recepção", descricao: null, permissoes: ["centros_custo"], menus_liberados: ["cadastros"] },
      ],
    },
  );

  await page.goto("/frota/configuracoes");
  await page.getByRole("tab", { name: "Grupos de usuários" }).click();
  await page.getByRole("button", { name: /Novo grupo/ }).click();

  await expect(page.getByRole("option", { name: "Recepção" })).toBeAttached();
});
