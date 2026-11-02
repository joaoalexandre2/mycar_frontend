import { useEffect, useState } from "react";
import { financeiroEsteticaService } from "../../services/estetica";
import { mensagemErro } from "../../services/api";
import type { FinanceiroDaEstetica } from "../../types/estetica";

const NOME_DA_FORMA: Record<string, string> = { pix: "Pix", cartao: "Cartão", dinheiro: "Dinheiro", boleto: "Boleto", a_definir: "Forma não definida" };

const reais = (valor: number) => `R$ ${valor.toFixed(2).replace(".", ",")}`;

/** Contas a receber: o que ainda não foi pago, por forma de pagamento e há quantos dias. */
export function Financeiro() {
  const [dados, setDados] = useState<FinanceiroDaEstetica | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    financeiroEsteticaService
      .listar()
      .then((d) => {
        if (ativo) setDados(d);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Financeiro</h2>
        <p className="mt-1 text-sm text-gray-500">Quanto ainda falta receber, e de que forma.</p>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      {dados && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Em aberto</p>
              <p className="text-2xl font-bold text-gray-900">{reais(dados.total_em_aberto)}</p>
              <p className="text-xs text-gray-500">{dados.quantidade_em_aberto} atendimento(s)</p>
            </div>
            {Object.entries(dados.por_forma).map(([forma, total]) => (
              <div key={forma} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{NOME_DA_FORMA[forma] ?? forma}</p>
                <p className="text-lg font-bold text-gray-900">{reais(total.valor)}</p>
                <p className="text-xs text-gray-500">{total.quantidade} atendimento(s)</p>
              </div>
            ))}
          </div>

          {dados.contas.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">Nenhuma conta em aberto.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {dados.contas.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.placa}{c.cliente_nome ? ` · ${c.cliente_nome}` : ""}</p>
                    <p className="text-xs text-gray-500">{NOME_DA_FORMA[c.forma_pagamento ?? "a_definir"]}</p>
                  </div>
                  <p className="text-xs text-gray-700">
                    {reais(c.valor)}
                    {c.dias_em_aberto !== null && <span className="ml-2 font-semibold text-amber-700">{c.dias_em_aberto} d em aberto</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
