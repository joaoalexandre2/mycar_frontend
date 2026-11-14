import { expect, test } from "@playwright/test";

/**
 * Testes de integração: usam a API de verdade (sem page.route). Precisam de um backend
 * rodando e de uma conta de frota com dados. Configure, por exemplo:
 *
 *   E2E_EMAIL=... E2E_SENHA=... npx playwright test --project=integracao
 *
 * Sem E2E_EMAIL e E2E_SENHA, os testes são pulados (o CI continua verde).
 */
const email = process.env.E2E_EMAIL;
const senha = process.env.E2E_SENHA;

test.describe("integração com a API", () => {
  test.skip(!email || !senha, "defina E2E_EMAIL e E2E_SENHA para rodar os testes de integração");

  test("entra com a conta real e cai no início da frota", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("voce@exemplo.com").fill(email!);
    await page.getByPlaceholder("********").fill(senha!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
    await expect(page.getByText("Frota Demonstração")).toBeVisible();
  });

  test("lista os veículos cadastrados na API", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("voce@exemplo.com").fill(email!);
    await page.getByPlaceholder("********").fill(senha!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();

    await page.goto("/veiculos");

    await expect(page.getByRole("heading", { name: "Veículos da frota" })).toBeVisible();
    await expect(page.getByText("ABC1D23")).toBeVisible();
  });

  test("a API recusa sem token", async ({ request }) => {
    const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8000/api";

    const resposta = await request.get(`${apiUrl}/conta/veiculos`, {
      headers: { Accept: "application/json" },
    });

    expect(resposta.status()).toBe(401);
  });
});
