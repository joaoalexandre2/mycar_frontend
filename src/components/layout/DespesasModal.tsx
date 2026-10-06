import { useEffect, useState } from "react";
import { CircleDollarSign, Fuel, ShieldCheck, Wrench, X } from "lucide-react";
import { contaService, despesaService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import type { Despesas, VeiculoConta } from "../../types/conta";

type Periodo = "mes" | "12m" | "ano" | "tudo";

const PERIODOS: { chave: Periodo; rotulo: string }[] = [
  { chave: "mes", rotulo: "Este mês" },
  { chave: "12m", rotulo: "12 meses" },
  { chave: "ano", rotulo: "Este ano" },
  { chave: "tudo", rotulo: "Tudo" },
];

function iso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${data.getFullYear()}-${mes}-${dia}`;
}

function intervalo(periodo: Periodo): { de?: string; ate?: string } {
  const hoje = new Date();

  switch (periodo) {
    case "mes":
      return { de: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)) };
    case "12m":
      return {
        de: iso(new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate())),
      };
    case "ano":
      return { de: iso(new Date(hoje.getFullYear(), 0, 1)) };
    default:
      return {};
  }
}

function Categoria({
  icone,
  titulo,
  total,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  total: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-gray-900">
          <span className="text-blue-600">{icone}</span>
          {titulo}
        </p>
        <p className="text-xs font-bold text-gray-900">{total}</p>
      </div>
      <ul className="divide-y divide-gray-100">{children}</ul>
    </div>
  );
}

function Linha({
  rotulo,
  detalhe,
  valor,
}: {
  rotulo: string;
  detalhe?: string;
  valor: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-gray-700">{rotulo}</p>
        {detalhe && <p className="text-[10px] text-gray-400">{detalhe}</p>}
      </div>
      <p className="shrink-0 text-xs font-semibold text-gray-900">{valor}</p>
    </li>
  );
}

export function DespesasModal({ onClose }: { onClose: () => void }) {
  const [periodo, setPeriodo] = useState<Periodo>("12m");
  const [veiculoId, setVeiculoId] = useState("");
  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [dados, setDados] = useState<Despesas | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    contaService
      .listarVeiculos({ porPagina: 100 })
      .then((pagina) => setVeiculos(pagina.dados))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ativo = true;

    despesaService
      .listar({
        ...intervalo(periodo),
        veiculoId: veiculoId ? Number(veiculoId) : undefined,
      })
      .then((resposta) => {
        if (!ativo) return;
        setErro(null);
        setDados(resposta);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [periodo, veiculoId]);

  const vazio =
    dados !== null &&
    dados.combustivel.itens.length === 0 &&
    dados.servicos.itens.length === 0 &&
    dados.seguro.itens.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <CircleDollarSign size={17} className="text-blue-600" />
              Despesas
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              Tudo que você registrou de combustível, serviços e seguro.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {PERIODOS.map((item) => (
              <button
                key={item.chave}
                type="button"
                onClick={() => setPeriodo(item.chave)}
                className={`h-8 rounded-full border px-3 text-[11px] font-semibold transition ${
                  periodo === item.chave
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {item.rotulo}
              </button>
            ))}

            {veiculos.length > 1 && (
              <select
                value={veiculoId}
                onChange={(e) => setVeiculoId(e.target.value)}
                className="ml-auto h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="">Todos os veículos</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.apelido?.trim() || `${v.marca} ${v.modelo}`} · {v.placa}
                  </option>
                ))}
              </select>
            )}
          </div>

          {erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {erro}
            </p>
          )}

          {!dados ? (
            !erro && <p className="text-xs text-gray-400">Carregando...</p>
          ) : (
            <>
              <div className="rounded-lg bg-blue-50 px-4 py-3">
                <p className="text-[11px] text-blue-700">
                  Gasto no período (combustível + serviços)
                </p>
                <p className="mt-1 text-xl font-bold text-blue-700">
                  {formatarMoeda(dados.total)}
                </p>
              </div>

              {vazio && (
                <p className="text-xs text-gray-400">
                  Nada registrado neste período. Os gastos aparecem aqui conforme
                  você registra abastecimentos (em Meus veículos) e serviços (na
                  aba Serviços, informando o valor pago).
                </p>
              )}

              {dados.combustivel.itens.length > 0 && (
                <Categoria
                  icone={<Fuel size={15} />}
                  titulo="Combustível"
                  total={formatarMoeda(dados.combustivel.total)}
                >
                  {dados.combustivel.itens.map((item) => (
                    <Linha
                      key={item.tipo}
                      rotulo={item.rotulo}
                      detalhe={`${item.quantidade} abastecimento(s) · ${item.litros.toLocaleString("pt-BR")} L`}
                      valor={formatarMoeda(item.total)}
                    />
                  ))}
                </Categoria>
              )}

              {dados.servicos.itens.length > 0 && (
                <Categoria
                  icone={<Wrench size={15} />}
                  titulo="Serviços"
                  total={formatarMoeda(dados.servicos.total)}
                >
                  {dados.servicos.itens.map((item) => (
                    <Linha
                      key={`${item.tipo}-${item.rotulo}`}
                      rotulo={item.rotulo}
                      detalhe={`${item.quantidade} serviço(s)`}
                      valor={formatarMoeda(item.total)}
                    />
                  ))}
                </Categoria>
              )}

              {dados.seguro.itens.length > 0 && (
                <Categoria
                  icone={<ShieldCheck size={15} />}
                  titulo="Seguro (valor por ano)"
                  total={formatarMoeda(dados.seguro.valorAnualTotal)}
                >
                  {dados.seguro.itens.map((item, indice) => (
                    <Linha
                      key={`${item.seguradora}-${indice}`}
                      rotulo={`${item.seguradora}${item.veiculo ? ` · ${item.veiculo}` : ""}`}
                      detalhe={
                        item.vigenciaFim
                          ? `Vai até ${formatarData(item.vigenciaFim)}`
                          : undefined
                      }
                      valor={formatarMoeda(item.valorAnual)}
                    />
                  ))}
                </Categoria>
              )}

              {dados.seguro.itens.length > 0 && (
                <p className="text-[11px] text-gray-400">
                  O seguro é o valor anual da apólice atual e não entra no total
                  do período, porque não registramos quando você pagou.
                </p>
              )}

              {!veiculoId && dados.porVeiculo.length > 1 && (
                <Categoria
                  icone={<CircleDollarSign size={15} />}
                  titulo="Por veículo"
                  total={formatarMoeda(dados.total)}
                >
                  {dados.porVeiculo.map((item) => (
                    <Linha
                      key={item.veiculoId}
                      rotulo={`${item.veiculo} · ${item.placa}`}
                      detalhe={`Combustível ${formatarMoeda(item.combustivel)} · serviços ${formatarMoeda(item.servicos)}`}
                      valor={formatarMoeda(item.total)}
                    />
                  ))}
                </Categoria>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
