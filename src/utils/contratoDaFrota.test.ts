import { describe, expect, it } from "vitest";
import { MODELOS_DE_GRUPO } from "./modelosDeGrupo";

/**
 * Contrato com o backend (app/Support/PermissoesFrota.php no repositório da API). O teste de lá
 * (ContratoDaFrotaTest) tem as mesmas listas: se uma ponta mudar sem a outra, um dos dois quebra.
 */
const PERMISSOES_DO_BACKEND = ["centros_custo", "grupos", "motoristas", "usos_corrigir", "usos_importar"];
const MENUS_DO_BACKEND = ["cadastros", "veiculos"];

describe("contrato da frota com o backend", () => {
  it("os modelos de grupo só usam permissões que o backend conhece", () => {
    for (const modelo of MODELOS_DE_GRUPO) {
      for (const permissao of modelo.permissoes) {
        expect(PERMISSOES_DO_BACKEND, `${modelo.id} usa ${permissao}`).toContain(permissao);
      }
    }
  });

  it("os modelos de grupo só liberam menus que o backend conhece", () => {
    for (const modelo of MODELOS_DE_GRUPO) {
      for (const menu of modelo.menus) {
        expect(MENUS_DO_BACKEND, `${modelo.id} libera ${menu}`).toContain(menu);
      }
    }
  });
});
