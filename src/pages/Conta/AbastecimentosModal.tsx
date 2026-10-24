import { useEffect, useState, type FormEvent } from "react";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { Fuel, Trash2 } from "lucide-react";
import { abastecimentoService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { Modal } from "../../components/ui/Modal";
import { lerInteiroBR, lerNumeroBR } from "../../utils/numero";
import { temEstimativas, tipoDe } from "../../utils/tipoVeiculo";
import { formatarData, formatarKm, formatarMoeda, hojeISO } from "../../utils/formatters";
import {
  COMBUSTIVEIS,
  type AbastecimentosDoVeiculo,
  type VeiculoConta,
} from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

const numero = (valor: number | null, casas: number, sufixo = "") =>
  valor === null
    ? "—"
    : `${valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}${sufixo}`;

/** Capacidade do tanque sem zero à toa: "53" e "38,5". */
const litrosDoTanque = (valor: number | null) =>
  valor === null ? "" : valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function AbastecimentosModal({
  veiculo,
  onClose,
}: {
  veiculo: VeiculoConta;
  onClose: () => void;
}) {
  const pedirConfirmacao = useConfirmar();
  const [dados, setDados] = useState<AbastecimentosDoVeiculo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [data, setData] = useState(hojeISO());
  const [km, setKm] = useState("");
  const [litros, setLitros] = useState("");
  const [valor, setValor] = useState("");
  const [cheio, setCheio] = useState(true);
  const [combustivel, setCombustivel] = useState("");
  const [posto, setPosto] = useState("");

  // Tanque cheio: os litros são a capacidade do tanque na ficha do modelo e o
  // campo fica travado. Sem a capacidade na ficha, a pessoa digita os litros.
  const tanqueLitros = dados?.tanqueLitros ?? null;
  const litrosTravados = cheio && tanqueLitros !== null;

  useEffect(() => {
    let ativo = true;

    abastecimentoService
      .listar(veiculo.id)
      .then((resposta) => {
        if (ativo) setDados(resposta);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculo.id]);

  async function registrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    const kmLido = lerInteiroBR(km);
    // Litros costumam vir com casas decimais ("38.5"): ponto não é milhar aqui.
    // Com o tanque cheio e a capacidade na ficha, os litros são os da ficha.
    const litrosLidos: ReturnType<typeof lerNumeroBR> =
      litrosTravados && tanqueLitros !== null
        ? { estado: "ok", valor: tanqueLitros }
        : lerNumeroBR(litros, { pontoComoMilhar: false });
    const valorLido = lerNumeroBR(valor);

    if (
      kmLido.estado !== "ok" ||
      litrosLidos.estado !== "ok" ||
      litrosLidos.valor <= 0 ||
      valorLido.estado !== "ok"
    ) {
      setErro(
        "Informe o km (só números), os litros (ex.: 38,5) e o valor pago (ex.: 230,00).",
      );
      return;
    }

    const kmNumerico = kmLido.valor;
    const litrosNumerico = litrosLidos.valor;
    const valorNumerico = valorLido.valor;

    try {
      setSalvando(true);
      const resposta = await abastecimentoService.registrar(veiculo.id, {
        data,
        km: kmNumerico,
        litros: litrosNumerico,
        valor_total: valorNumerico,
        tanque_cheio: cheio,
        combustivel: combustivel || null,
        posto: posto.trim() || null,
      });
      setDados(resposta);
      setKm("");
      setLitros("");
      setValor("");
      setPosto("");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number) {
    if (!(await pedirConfirmacao({
      mensagem: "Remover este abastecimento?",
      confirmarTexto: "Remover",
      perigo: true,
    }))) return;

    try {
      setDados(await abastecimentoService.remover(veiculo.id, id));
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  const resumo = dados?.resumo;
  const nome = veiculo.apelido?.trim() || `${veiculo.marca} ${veiculo.modelo}`;

  return (
    <Modal
      titulo="Abastecimentos"
      subtitulo={`${nome} · ${veiculo.placa}`}
      icone={<Fuel size={16} className="text-blue-600" />}
      larguraMax="max-w-2xl"
      onClose={onClose}
    >
      <div className="space-y-5 px-6 py-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Consumo médio", numero(resumo?.consumoMedioKmL ?? null, 2, " km/l")],
            ["Custo por km", resumo?.custoPorKm == null ? "—" : formatarMoeda(resumo.custoPorKm)],
            ["Preço médio do litro", resumo?.precoMedioLitro == null ? "—" : formatarMoeda(resumo.precoMedioLitro)],
            ["Total gasto", resumo ? formatarMoeda(resumo.totalGasto) : "—"],
          ].map(([titulo, valorCartao]) => (
            <div key={titulo} className="rounded-lg border border-gray-200 p-3">
              <p className="text-[10px] text-gray-400">{titulo}</p>
              <p className="mt-1 text-sm font-bold text-gray-900">{valorCartao}</p>
            </div>
          ))}
        </div>

        {resumo && resumo.consumoMedioKmL === null && (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            O consumo aparece a partir do segundo abastecimento com tanque
            cheio. O primeiro serve só como ponto de partida.
          </p>
        )}

        <form onSubmit={(e) => void registrar(e)} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-700">Novo abastecimento</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block text-[11px] text-gray-500">
              Data
              <input
                type="date"
                value={data}
                max={hojeISO()}
                onChange={(e) => setData(e.target.value)}
                className={`mt-1 ${classeCampo}`}
                required
              />
            </label>
            <label className="block text-[11px] text-gray-500">
              Km no hodômetro
              <input
                type="number"
                min="0"
                value={km}
                placeholder={resumo?.kmAtual ? `Último: ${resumo.kmAtual}` : "Ex.: 45200"}
                onChange={(e) => setKm(e.target.value)}
                className={`mt-1 ${classeCampo}`}
                required
              />
            </label>
            <label className="block text-[11px] text-gray-500">
              Litros
              <input
                type="text"
                inputMode="decimal"
                value={litrosTravados ? litrosDoTanque(tanqueLitros) : litros}
                placeholder="Ex.: 38,5"
                onChange={(e) => setLitros(e.target.value)}
                disabled={litrosTravados}
                title={litrosTravados ? "Capacidade do tanque, da ficha técnica do modelo" : undefined}
                className={`mt-1 ${classeCampo} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500`}
                required
              />
            </label>
            <label className="block text-[11px] text-gray-500">
              Valor pago (R$)
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                placeholder="Ex.: 230,00"
                onChange={(e) => setValor(e.target.value)}
                className={`mt-1 ${classeCampo}`}
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-[11px] text-gray-500">
              Combustível (opcional)
              <select
                value={combustivel}
                onChange={(e) => setCombustivel(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              >
                <option value="">—</option>
                {COMBUSTIVEIS.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.rotulo}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-gray-500">
              Posto (opcional)
              <input
                type="text"
                value={posto}
                maxLength={80}
                onChange={(e) => setPosto(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={cheio}
              onChange={(e) => setCheio(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-blue-600"
            />
            Encheu o tanque (necessário para calcular o consumo)
          </label>

          {litrosTravados && (
            <p className="text-[11px] text-gray-500">
              Litros preenchidos com a capacidade do tanque na ficha técnica do modelo (
              {litrosDoTanque(tanqueLitros)} l). Desmarque para informar um valor diferente.
            </p>
          )}

          {cheio && dados && tanqueLitros === null && (
            <p className="text-[11px] text-gray-500">
              {temEstimativas(tipoDe(veiculo.tipoVeiculo))
                ? "A ficha deste modelo não traz a capacidade do tanque: digite os litros abastecidos."
                : "Para motos e caminhões não temos a capacidade do tanque: digite os litros abastecidos."}
            </p>
          )}

          {erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {erro}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>

        {!dados ? (
          <p className="text-xs text-gray-400">Carregando...</p>
        ) : dados.abastecimentos.length === 0 ? (
          <p className="text-xs text-gray-400">
            Nenhum abastecimento registrado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {dados.abastecimentos.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">
                    {formatarData(item.data)} · {formatarKm(item.km)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {numero(item.litros, 2, " l")} · {formatarMoeda(item.valorTotal)}
                    {item.precoLitro !== null && ` · ${formatarMoeda(item.precoLitro)}/l`}
                    {item.combustivel && ` · ${item.combustivel}`}
                    {item.posto && ` · ${item.posto}`}
                    {!item.tanqueCheio && " · parcial"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {item.consumoKmL !== null && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                      {numero(item.consumoKmL, 2, " km/l")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void remover(item.id)}
                    title="Remover"
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
