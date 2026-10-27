import { useId, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useEnvio } from "../../hooks/useEnvio";
import { useErrosDeCampo } from "../../hooks/useErrosDeCampo";
import { ErroDoCampo } from "../../components/ui/ErroDoCampo";

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
  }) => void | Promise<void>;
}) {
  const { enviando, enviar } = useEnvio();
  const { erros, mostrar, limpar, atributos } = useErrosDeCampo();
  const idNome = useId();
  const idCpf = useId();
  const idTelefone = useId();
  const idEmail = useId();
  const idAjudaEmail = useId();
  const idStatus = useId();
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [cpf, setCpf] = useState(
    cliente?.cpf ? formatarCpf(cliente.cpf) : "",
  );
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [ativo, setAtivo] = useState(cliente?.ativo ?? true);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const novos: Record<string, string> = {};

    if (!nome.trim()) novos[idNome] = "Informe o nome do cliente.";
    if (soDigitos(cpf).length !== 11) novos[idCpf] = "O CPF precisa ter 11 dígitos.";
    if (!telefone.trim()) novos[idTelefone] = "Informe o telefone.";

    // O e-mail é opcional; se foi preenchido, precisa parecer um e-mail.
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      novos[idEmail] = "Informe um e-mail válido, como nome@exemplo.com.";
    }

    if (Object.keys(novos).length > 0) {
      mostrar(novos, [idNome, idCpf, idTelefone, idEmail]);
      return;
    }

    void enviar(() =>
      onSave({
        nome: nome.trim(),
        cpf,
        telefone: telefone.trim(),
        email,
        ativo,
      }),
    );
  }

  return (
    <Modal
      titulo={cliente ? "Editar cliente" : "Novo cliente"}
      subtitulo="Informe os dados do cliente."
      larguraMax="max-w-lg"
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label
              htmlFor={idNome}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Nome completo
            </label>
            <input
              id={idNome}
              type="text"
              autoComplete="name"
              {...atributos(idNome)}
              value={nome}
              onChange={(event) => {
                setNome(event.target.value);
                limpar(idNome);
              }}
              placeholder="Ex.: João da Silva"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-500 focus:border-blue-500 aria-invalid:border-red-500"
              required
            />
            <ErroDoCampo campo={idNome} mensagem={erros[idNome]} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={idCpf}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                CPF
              </label>
              <input
                id={idCpf}
                type="text"
                inputMode="numeric"
                {...atributos(idCpf)}
                value={cpf}
                onChange={(event) => {
                  setCpf(formatarCpf(event.target.value));
                  limpar(idCpf);
                }}
                placeholder="000.000.000-00"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-500 focus:border-blue-500 aria-invalid:border-red-500"
                required
              />
              <ErroDoCampo campo={idCpf} mensagem={erros[idCpf]} />
            </div>
            <div>
              <label
                htmlFor={idTelefone}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Telefone
              </label>
              <input
                id={idTelefone}
                type="text"
                inputMode="tel"
                autoComplete="tel"
                {...atributos(idTelefone)}
                value={telefone}
                onChange={(event) => {
                  setTelefone(event.target.value);
                  limpar(idTelefone);
                }}
                placeholder="(00) 00000-0000"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-500 focus:border-blue-500 aria-invalid:border-red-500"
                required
              />
              <ErroDoCampo campo={idTelefone} mensagem={erros[idTelefone]} />
            </div>
          </div>

          <div>
            <label
              htmlFor={idEmail}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              E-mail
            </label>
            <input
              id={idEmail}
              type="email"
              autoComplete="email"
              {...atributos(idEmail, idAjudaEmail)}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                limpar(idEmail);
              }}
              placeholder="cliente@exemplo.com"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-500 focus:border-blue-500 aria-invalid:border-red-500"
            />
            <ErroDoCampo campo={idEmail} mensagem={erros[idEmail]} />
            <p id={idAjudaEmail} className="mt-1 text-xs text-gray-500">
              Opcional. Usado para avisar sobre manutenções próximas ou atrasadas.
            </p>
          </div>

          <div>
            <label
              htmlFor={idStatus}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id={idStatus}
              value={ativo ? "ativo" : "inativo"}
              onChange={(event) =>
                setAtivo(event.target.value === "ativo")
              }
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500 aria-invalid:border-red-500"
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
            disabled={enviando}
            className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Salvando..."
              : cliente
                ? "Salvar alterações"
                : "Criar cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
