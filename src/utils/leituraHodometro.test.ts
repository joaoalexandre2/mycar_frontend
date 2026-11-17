import { afterEach, describe, expect, it, vi } from "vitest";
import { usosService } from "../services/frota";
import { lerKmDoVisor } from "./ocrHodometro";
import { lerKmDoHodometro } from "./leituraHodometro";

vi.mock("./recorteDoHodometro", () => ({
  recortarVisor: vi.fn(async () => new Blob(["recorte"], { type: "image/jpeg" })),
}));

vi.mock("./ocrHodometro", async (original) => ({
  ...(await original<typeof import("./ocrHodometro")>()),
  lerKmDoVisor: vi.fn(async () => 11111),
}));

afterEach(() => vi.clearAllMocks());

const foto = new Blob(["foto"], { type: "image/jpeg" });
const area = { x: 10, y: 20, largura: 200, altura: 60 };

describe("lerKmDoHodometro", () => {
  it("usa a leitura da IA do servidor quando ela responde", async () => {
    const ia = vi.spyOn(usosService, "lerHodometro").mockResolvedValue(45200);

    expect(await lerKmDoHodometro(foto, area)).toBe(45200);
    expect(ia).toHaveBeenCalledTimes(1);
    expect(lerKmDoVisor).not.toHaveBeenCalled();
  });

  it("respeita quando a IA diz que não dá para ler (não chuta com o OCR)", async () => {
    vi.spyOn(usosService, "lerHodometro").mockResolvedValue(null);

    expect(await lerKmDoHodometro(foto, area)).toBeNull();
    expect(lerKmDoVisor).not.toHaveBeenCalled();
  });

  it("cai na leitura do navegador quando a IA está desligada ou fora do ar", async () => {
    vi.spyOn(usosService, "lerHodometro").mockRejectedValue(new Error("503"));

    expect(await lerKmDoHodometro(foto, area)).toBe(11111);
    expect(lerKmDoVisor).toHaveBeenCalledWith(foto, area);
  });
});
