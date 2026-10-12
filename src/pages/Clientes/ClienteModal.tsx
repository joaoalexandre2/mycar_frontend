import { useState } from "react";
import { useToast } from "../../hooks/useNotificacoes";
import { X } from "lucide-react";
import type { Cliente } from "../../types/cliente";
import { formatarCpf, soDigitos } from "../../utils/formatters";

export function ClienteModal({
  cliente,
  onClose,
  onSave,
}: {
  cliente: Cliente | null;
  onClose: () => void;
  onSave: (cliente: {
    nome: string;
    cpf: string;
    telefone: string;
    email: string;
    ativo: boolean;
  }) => void;
}) {
  const toast = useToast();
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [cpf, setCpf] = useState(
    cliente?.cpf ? formatarCpf(cliente.cpf) : "",
  );
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [ativo, setAtivo] = useState(cliente?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nome.trim() || soDigitos(cpf).length !== 11 || !telefone.trim()) {
      toast.aviso("Preencha nome, CPF com 11 dígitos e telefone.");
      return;
    }

    setSalvando(true);
    await onSave({
      nome: nome.trim(),
      cpf,
      telefone: telefone.trim(),
      email,
      ativo,
    });
    setSalvando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {cliente ? "Editar cliente" : "Novo cliente"}
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              Informe os dados do cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex.: João da Silva"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(event) =>
                    setCpf(formatarCpf(event.target.value))
                  }
                  placeholder="000.000.000-00"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(event) => setTelefone(event.target.value)}
                  placeholder="(00) 00000-0000"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="cliente@exemplo.com"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Opcional. Usado para avisar sobre manutenções próximas ou atrasadas.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={ativo ? "ativo" : "inativo"}
                onChange={(event) =>
                  setAtivo(event.target.value === "ativo")
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {cliente ? "Salvar alterações" : "Criar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
