import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Info, Pencil } from "lucide-react";
import { contaService, fichaTecnicaContaService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import { linksDaFicha } from "../../utils/fichaTecnica";
import type {
  CampoFicha,
  FichaTecnicaConta,
  ManutencaoFicha,
  VeiculoConta,
} from "../../types/conta";

type Chave = keyof NonNullable<ManutencaoFicha>;
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

const classeCampo =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

function Cartao({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="font-display text-xl leading-none font-bold tracking-wide text-gray-900 uppercase">{titulo}</h3>
          {descricao && <p className="mt-1 text-[11px] text-gray-400">{descricao}</p>}
        </div>
        {acao}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Lista({ campos }: { campos: CampoFicha[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {campos.map((campo) => (
        <div key={campo.chave}>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {campo.rotulo}
          </dt>
          <dd className="mt-0.5 text-xs text-gray-800">{campo.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FichaTecnica() {
  const [veiculos, setVeiculos] = useState<VeiculoConta[] | null>(null);
  const [veiculoId, setVeiculoId] = useState<string | null>(null);
  const [ficha, setFicha] = useState<FichaTecnicaConta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    contaService
      .listarVeiculos({ porPagina: 100 })
      .then((pagina) => {
        if (!ativo) return;
        setVeiculos(pagina.dados);
        setVeiculoId(pagina.dados[0] ? String(pagina.dados[0].id) : "");
      })
      .catch((error) => {
        if (!ativo) return;
        setErro(mensagemErro(error));
        setVeiculos([]);
        setVeiculoId("");
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!veiculoId) return;

    let ativo = true;

    fichaTecnicaContaService
      .buscar(Number(veiculoId))
      .then((dados) => {
        if (!ativo) return;
        setErro(null);
        setFicha(dados);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculoId]);

  function trocarVeiculo(valor: string) {
    setVeiculoId(valor);
    setFicha(null);
    setEditando(false);
  }

  function iniciarEdicao() {
    const atual: ManutencaoFicha = ficha?.manutencao ?? {};
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

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!veiculoId) return;

    const dados: Record<string, string | number | null> = {};

    for (const [chave, valor] of Object.entries(form)) {
      const texto = valor.trim();
      const numerico = GRUPOS.some((g) =>
        g.campos.some((c) => c.chave === chave && c.numerico),
      );

      dados[chave] = texto === "" ? null : numerico ? Number(texto.replace(",", ".")) : texto;
    }

    try {
      setSalvando(true);
      setFicha(await fichaTecnicaContaService.salvar(Number(veiculoId), dados));
      setEditando(false);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  const veiculo = (veiculos ?? []).find((v) => String(v.id) === veiculoId) ?? null;
  const links = ficha ? linksDaFicha(ficha.veiculo) : null;
  const manutencao = ficha?.manutencao ?? null;

  const manutencaoPreenchida = GRUPOS.map((grupo) => ({
    titulo: grupo.titulo,
    campos: grupo.campos
      .map((campo) => ({ campo, valor: manutencao?.[campo.chave] }))
      .filter(({ valor }) => valor !== null && valor !== undefined && valor !== ""),
  })).filter((g) => g.campos.length > 0);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] leading-none font-bold tracking-wide text-gray-900 uppercase">Ficha técnica</h2>
          <p className="mt-1 text-xs text-gray-500">
            O que buscamos sobre o seu carro e a ficha de manutenção dele.
          </p>
        </div>

        {veiculos && veiculos.length > 0 && (
          <select
            value={veiculoId ?? ""}
            onChange={(e) => trocarVeiculo(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500 sm:w-72"
          >
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.apelido?.trim() || `${v.marca} ${v.modelo}`} · {v.placa}
              </option>
            ))}
          </select>
        )}
      </div>

      {erro && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {erro}
        </p>
      )}

      {veiculos?.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-xs text-gray-500">Cadastre um veículo para ver a ficha técnica.</p>
          <Link
            to="/veiculos"
            className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Cadastrar veículo
          </Link>
        </div>
      )}

      {veiculo && !ficha && !erro && <p className="text-xs text-gray-400">Carregando...</p>}

      {ficha && (
        <div className="space-y-4">
          <Cartao titulo="Seu veículo">
            <Lista
              campos={[
                { chave: "veiculo", rotulo: "Veículo", valor: ficha.veiculo.nome },
                { chave: "placa", rotulo: "Placa", valor: ficha.veiculo.placa },
                { chave: "marca", rotulo: "Marca", valor: ficha.veiculo.marca },
                { chave: "modelo", rotulo: "Modelo / versão", valor: ficha.veiculo.modelo },
                { chave: "ano", rotulo: "Ano (fabricação/modelo)", valor: ficha.veiculo.ano_completo ?? String(ficha.veiculo.ano) },
              ]}
            />
          </Cartao>

          <Cartao
            titulo="Tabela FIPE"
            descricao="Consultada agora, a partir do código FIPE do cadastro do veículo."
          >
            {ficha.fipe ? (
              <Lista
                campos={[
                  { chave: "codigo", rotulo: "Código FIPE", valor: ficha.fipe.codigoFipe ?? "—" },
                  { chave: "combustivel", rotulo: "Combustível", valor: ficha.fipe.combustivel ?? "—" },
                  { chave: "ano", rotulo: "Ano-modelo", valor: String(ficha.fipe.anoModelo ?? "—") },
                  {
                    chave: "valor",
                    rotulo: "Valor",
                    valor: ficha.fipe.valor !== null ? formatarMoeda(ficha.fipe.valor) : "—",
                  },
                  { chave: "ref", rotulo: "Mês de referência", valor: ficha.fipe.mesReferencia ?? "—" },
                ]}
              />
            ) : ficha.fipeStatus === "indisponivel" ? (
              <p className="text-xs text-gray-500">
                A tabela FIPE não respondeu agora. Tente de novo em instantes.
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Este veículo foi cadastrado sem o código FIPE. Edite-o em{" "}
                <Link to="/veiculos" className="font-semibold text-blue-600 hover:text-blue-700">
                  Meus veículos
                </Link>{" "}
                escolhendo marca, modelo e ano na tabela FIPE para ver estes dados.
              </p>
            )}
          </Cartao>

          <Cartao
            titulo="O que a versão informa"
            descricao="Lido do nome da versão cadastrada. Só aparece o que está escrito nele."
          >
            {ficha.especificacoes.length > 0 ? (
              <Lista campos={ficha.especificacoes} />
            ) : (
              <p className="text-xs text-gray-500">
                O nome desta versão não traz motor, câmbio ou portas.
              </p>
            )}
          </Cartao>

          <Cartao
            titulo="Dados do modelo"
            descricao={
              ficha.dadosModelo
                ? `Coletados da ${ficha.dadosModelo.fonte} para o ${ficha.dadosModelo.modelo}.`
                : undefined
            }
          >
            {ficha.dadosModelo ? (
              <>
                <Lista campos={ficha.dadosModelo.campos} />
                <p className="mt-4 flex items-start gap-2 text-[11px] text-gray-400">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <span>
                    São dados do modelo como um todo: podem juntar gerações,
                    versões e mercados diferentes e não valem para a sua versão
                    exata. Confira no manual. Fonte:{" "}
                    <a
                      href={ficha.dadosModelo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {ficha.dadosModelo.fonte} ({ficha.dadosModelo.pagina})
                    </a>
                    , licença {ficha.dadosModelo.licenca}, coletado em{" "}
                    {formatarData(ficha.dadosModelo.coletadoEm)}.
                  </span>
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-500">
                Ainda não temos dados coletados para este modelo. Use os atalhos
                abaixo para achar a ficha.
              </p>
            )}
          </Cartao>

          <Cartao
            titulo="Manutenção do seu carro"
            descricao="Óleo, filtros e pneus. Preencha uma vez e consulte quando precisar."
            acao={
              !editando && (
                <button
                  type="button"
                  onClick={iniciarEdicao}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Pencil size={13} />
                  {manutencaoPreenchida.length > 0 ? "Editar" : "Preencher"}
                </button>
              )
            }
          >
            {editando ? (
              <form onSubmit={(e) => void salvar(e)} className="space-y-4">
                {GRUPOS.map((grupo) => (
                  <div key={grupo.titulo}>
                    <p className="mb-2 text-xs font-medium text-gray-700">{grupo.titulo}</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {grupo.campos.map((campo) => (
                        <label key={campo.chave} className="block text-[11px] text-gray-500">
                          {campo.rotulo}
                          <input
                            type="text"
                            inputMode={campo.numerico ? "decimal" : undefined}
                            value={form[campo.chave] ?? ""}
                            onChange={(e) => setForm({ ...form, [campo.chave]: e.target.value })}
                            className={`mt-1 ${classeCampo}`}
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
                    maxLength={2000}
                    rows={3}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
                  />
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditando(false)}
                    className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            ) : manutencaoPreenchida.length > 0 || manutencao?.observacoes ? (
              <div className="space-y-4">
                {manutencaoPreenchida.map((grupo) => (
                  <div key={grupo.titulo}>
                    <p className="mb-2 text-xs font-medium text-gray-700">{grupo.titulo}</p>
                    <Lista
                      campos={grupo.campos.map(({ campo, valor }) => ({
                        chave: campo.chave,
                        rotulo: campo.rotulo.replace(/ \(.*\)$/, ""),
                        valor: String(valor),
                      }))}
                    />
                  </div>
                ))}
                {manutencao?.observacoes && (
                  <p className="text-xs text-gray-600">{manutencao.observacoes}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Nada preenchido ainda. Clique em “Preencher” e anote, por
                exemplo, o óleo e a pressão dos pneus que o manual indica.
              </p>
            )}
          </Cartao>

          {links && (
            <Cartao
              titulo="Onde achar mais"
              descricao="Abrem a busca já com o seu carro."
            >
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                {[
                  ["Ficha técnica completa", links.fichaCompleta],
                  ["Manual do proprietário", links.manual],
                  ["Consumo oficial (Inmetro)", links.inmetro],
                ].map(([rotulo, url]) => (
                  <a
                    key={rotulo}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {rotulo} <ExternalLink size={12} />
                  </a>
                ))}
                <Link to="/pecas" className="font-semibold text-blue-600 hover:text-blue-700">
                  Peças do meu carro
                </Link>
              </div>
            </Cartao>
          )}
        </div>
      )}
    </div>
  );
}
