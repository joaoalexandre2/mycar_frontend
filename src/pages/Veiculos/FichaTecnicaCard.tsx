import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import {
  fichaTecnicaService,
  type FichaTecnica,
  type FichaTecnicaDados,
} from "../../services/fichaTecnica";
import { mensagemErro } from "../../services/api";

type Chave = keyof FichaTecnicaDados;
type Campo = { chave: Chave; rotulo: string; numerico?: boolean };

const GRUPOS: { titulo: string; campos: Campo[] }[] = [
  {
    titulo: "Óleo do motor",
    campos: [
      { chave: "oleo_viscosidade", rotulo: "Viscosidade (ex.: 5W30)" },
      { chave: "oleo_especificacao", rotulo: "Especificação (ex.: API SN)" },
      { chave: "oleo_capacidade_litros", rotulo: "Capacidade (litros)", numerico: true },
    ],
  },
  {
    titulo: "Filtros",
    campos: [
      { chave: "filtro_oleo", rotulo: "Filtro de óleo" },
      { chave: "filtro_ar", rotulo: "Filtro de ar" },
      { chave: "filtro_combustivel", rotulo: "Filtro de combustível" },
    ],
  },
  {
    titulo: "Pneus",
    campos: [
      { chave: "pneu_medida", rotulo: "Medida (ex.: 185/65 R15)" },
      { chave: "pneu_pressao_dianteira", rotulo: "Pressão dianteira (psi)", numerico: true },
      { chave: "pneu_pressao_traseira", rotulo: "Pressão traseira (psi)", numerico: true },
    ],
  },
];

const CAMPOS_NUMERICOS = new Set<string>(
  GRUPOS.flatMap((g) => g.campos.filter((c) => c.numerico).map((c) => c.chave)),
);

export function FichaTecnicaCard({ veiculoId }: { veiculoId: number }) {
  const [ficha, setFicha] = useState<FichaTecnica | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    fichaTecnicaService
      .buscar(veiculoId)
      .then((dados) => {
        if (ativo) setFicha(dados);
      })
      .catch((error) => {
        if (ativo) window.alert(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculoId]);

  function iniciarEdicao() {
    const atual: Partial<Record<Chave, unknown>> = ficha?.dados ?? {};
    const inicial: Record<string, string> = {
      observacoes: String(atual.observacoes ?? ""),
    };

    for (const grupo of GRUPOS) {
      for (const campo of grupo.campos) {
        inicial[campo.chave] = String(atual[campo.chave] ?? "");
      }
    }

    setForm(inicial);
    setEditando(true);
  }

  async function salvar() {
    const payload: Record<string, string | number | null> = {};

    for (const [chave, valor] of Object.entries(form)) {
      const texto = valor.trim();

      payload[chave] =
        texto === "" ? null : CAMPOS_NUMERICOS.has(chave) ? Number(texto) : texto;
    }

    try {
      setSalvando(true);
      setFicha(await fichaTecnicaService.salvar(veiculoId, payload));
      setEditando(false);
    } catch (error) {
      window.alert(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  const dados = ficha?.dados;

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Ficha técnica</h3>
          <p className="mt-1 text-[11px] text-gray-400">
            Óleo, filtros e pneus deste veículo. Dados preenchidos manualmente:
            confirme com o manual do fabricante.
          </p>
        </div>
        {!editando && (
          <button
            onClick={iniciarEdicao}
            className="flex h-8 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 text-[11px] font-medium text-gray-600 hover:bg-gray-50 print:hidden"
          >
            <Pencil size={13} />
            {dados ? "Editar" : "Preencher"}
          </button>
        )}
      </div>

      {editando ? (
        <div className="space-y-4 p-5">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="mb-2 text-xs font-semibold text-gray-700">
                {grupo.titulo}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {grupo.campos.map((campo) => (
                  <label
                    key={campo.chave}
                    className="block text-[11px] text-gray-500"
                  >
                    {campo.rotulo}
                    <input
                      type={campo.numerico ? "number" : "text"}
                      step={campo.chave === "oleo_capacidade_litros" ? "0.1" : "1"}
                      value={form[campo.chave] ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, [campo.chave]: e.target.value })
                      }
                      className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <label className="block text-[11px] text-gray-500">
            Observações
            <textarea
              value={form.observacoes ?? ""}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditando(false)}
              className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => void salvar()}
              disabled={salvando}
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      ) : dados ? (
        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="mb-2 text-xs font-semibold text-gray-700">
                {grupo.titulo}
              </p>
              <dl className="space-y-1.5">
                {grupo.campos.map((campo) => (
                  <div
                    key={campo.chave}
                    className="flex justify-between gap-3 text-[11px]"
                  >
                    <dt className="text-gray-400">
                      {campo.rotulo.replace(/ \(.*\)/, "")}
                    </dt>
                    <dd className="font-medium text-gray-700">
                      {dados[campo.chave] ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          {dados.observacoes && (
            <p className="text-[11px] text-gray-500 md:col-span-3">
              {dados.observacoes}
            </p>
          )}
        </div>
      ) : (
        <p className="p-5 text-xs text-gray-400">
          Nenhuma ficha técnica cadastrada para este veículo ainda.
        </p>
      )}
    </div>
  );
}
