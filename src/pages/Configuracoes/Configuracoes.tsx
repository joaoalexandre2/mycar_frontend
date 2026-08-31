import { useState } from "react";
import {
  Building2,
  Check,
  Palette,
  Save,
  Settings,
  User,
} from "lucide-react";

type AbaConfiguracao =
  | "perfil"
  | "oficina"
  | "sistema"
  | "aparencia";

export function Configuracoes() {
  const [abaAtiva, setAbaAtiva] =
    useState<AbaConfiguracao>("perfil");

  const [nome, setNome] = useState("João Kirst");
  const [email, setEmail] = useState("joao@mycar.com");
  const [telefone, setTelefone] = useState("(45) 99999-9999");

  const [nomeOficina, setNomeOficina] =
    useState("MyCar Oficina");
  const [cnpj, setCnpj] = useState("00.000.000/0001-00");
  const [telefoneOficina, setTelefoneOficina] =
    useState("(45) 3035-0000");
  const [endereco, setEndereco] =
    useState("Cascavel - PR");

  const [moeda, setMoeda] = useState("BRL");
  const [formatoData, setFormatoData] =
    useState("dd/MM/yyyy");
  const [itensPorPagina, setItensPorPagina] =
    useState("10");

  const [tema, setTema] = useState("claro");
  const [corPrincipal, setCorPrincipal] =
    useState("blue");

  const [salvo, setSalvo] = useState(false);

  function salvarConfiguracoes() {
    setSalvo(true);

    setTimeout(() => {
      setSalvo(false);
    }, 2500);
  }

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="mb-7">
        <h2 className="text-[21px] font-bold text-gray-900">
          Configurações
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          Gerencie as configurações do sistema e da sua oficina.
        </p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6">
        {/* Menu lateral */}
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-2">
          <ConfigItem
            icon={<User size={17} />}
            label="Perfil"
            ativo={abaAtiva === "perfil"}
            onClick={() => setAbaAtiva("perfil")}
          />

          <ConfigItem
            icon={<Building2 size={17} />}
            label="Oficina"
            ativo={abaAtiva === "oficina"}
            onClick={() => setAbaAtiva("oficina")}
          />

          <ConfigItem
            icon={<Settings size={17} />}
            label="Sistema"
            ativo={abaAtiva === "sistema"}
            onClick={() => setAbaAtiva("sistema")}
          />

          <ConfigItem
            icon={<Palette size={17} />}
            label="Aparência"
            ativo={abaAtiva === "aparencia"}
            onClick={() => setAbaAtiva("aparencia")}
          />
        </div>

        {/* Conteúdo */}
        <div className="rounded-xl border border-gray-200 bg-white">
          {/* Perfil */}
          {abaAtiva === "perfil" && (
            <Section
              titulo="Perfil"
              descricao="Gerencie as informações do usuário administrador."
            >
              <div className="grid grid-cols-2 gap-5">
                <Input
                  label="Nome"
                  value={nome}
                  onChange={setNome}
                />

                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                />

                <Input
                  label="Telefone"
                  value={telefone}
                  onChange={setTelefone}
                />
              </div>
            </Section>
          )}

          {/* Oficina */}
          {abaAtiva === "oficina" && (
            <Section
              titulo="Oficina"
              descricao="Configure as informações da sua oficina."
            >
              <div className="grid grid-cols-2 gap-5">
                <Input
                  label="Nome da oficina"
                  value={nomeOficina}
                  onChange={setNomeOficina}
                />

                <Input
                  label="CNPJ"
                  value={cnpj}
                  onChange={setCnpj}
                />

                <Input
                  label="Telefone"
                  value={telefoneOficina}
                  onChange={setTelefoneOficina}
                />

                <Input
                  label="Endereço"
                  value={endereco}
                  onChange={setEndereco}
                />
              </div>
            </Section>
          )}

          {/* Sistema */}
          {abaAtiva === "sistema" && (
            <Section
              titulo="Sistema"
              descricao="Configure o comportamento padrão do sistema."
            >
              <div className="grid grid-cols-2 gap-5">
                <Select
                  label="Moeda"
                  value={moeda}
                  onChange={setMoeda}
                >
                  <option value="BRL">
                    Real brasileiro (R$)
                  </option>

                  <option value="USD">
                    Dólar americano ($)
                  </option>
                </Select>

                <Select
                  label="Formato de data"
                  value={formatoData}
                  onChange={setFormatoData}
                >
                  <option value="dd/MM/yyyy">
                    24/08/2026
                  </option>

                  <option value="MM/dd/yyyy">
                    08/24/2026
                  </option>
                </Select>

                <Select
                  label="Itens por página"
                  value={itensPorPagina}
                  onChange={setItensPorPagina}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>
            </Section>
          )}

          {/* Aparência */}
          {abaAtiva === "aparencia" && (
            <Section
              titulo="Aparência"
              descricao="Personalize a aparência do MyCar."
            >
              <div className="space-y-6">
                {/* Tema */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    Tema
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <ThemeOption
                      titulo="Claro"
                      descricao="Interface clara"
                      ativo={tema === "claro"}
                      onClick={() => setTema("claro")}
                    />

                    <ThemeOption
                      titulo="Escuro"
                      descricao="Interface escura"
                      ativo={tema === "escuro"}
                      onClick={() => setTema("escuro")}
                    />
                  </div>
                </div>

                {/* Cor */}
                <div>
                  <label className="mb-3 block text-xs font-medium text-gray-700">
                    Cor principal
                  </label>

                  <div className="flex gap-3">
                    <ColorOption
                      cor="bg-blue-600"
                      ativo={corPrincipal === "blue"}
                      onClick={() => setCorPrincipal("blue")}
                    />

                    <ColorOption
                      cor="bg-green-600"
                      ativo={corPrincipal === "green"}
                      onClick={() =>
                        setCorPrincipal("green")
                      }
                    />

                    <ColorOption
                      cor="bg-purple-600"
                      ativo={corPrincipal === "purple"}
                      onClick={() =>
                        setCorPrincipal("purple")
                      }
                    />

                    <ColorOption
                      cor="bg-orange-500"
                      ativo={corPrincipal === "orange"}
                      onClick={() =>
                        setCorPrincipal("orange")
                      }
                    />
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            {salvo && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                <Check size={15} />
                Configurações salvas
              </span>
            )}

            <button
              onClick={salvarConfiguracoes}
              className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Save size={15} />

              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================= */
/* MENU CONFIGURAÇÕES */
/* ============================= */

function ConfigItem({
  icon,
  label,
  ativo,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-xs font-medium transition ${
        ativo
          ? "bg-blue-50 text-blue-600"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {icon}

      {label}
    </button>
  );
}

/* ============================= */
/* SECTION */
/* ============================= */

function Section({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-gray-200 px-6 py-5">
        <h3 className="text-sm font-semibold text-gray-900">
          {titulo}
        </h3>

        <p className="mt-1 text-[11px] text-gray-400">
          {descricao}
        </p>
      </div>

      <div className="px-6 py-6">
        {children}
      </div>
    </div>
  );
}

/* ============================= */
/* INPUT */
/* ============================= */

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* ============================= */
/* SELECT */
/* ============================= */

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </div>
  );
}

/* ============================= */
/* TEMA */
/* ============================= */

function ThemeOption({
  titulo,
  descricao,
  ativo,
  onClick,
}: {
  titulo: string;
  descricao: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition ${
        ativo
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold ${
            ativo
              ? "text-blue-600"
              : "text-gray-700"
          }`}
        >
          {titulo}
        </span>

        {ativo && (
          <Check
            size={16}
            className="text-blue-600"
          />
        )}
      </div>

      <p className="mt-1 text-[11px] text-gray-400">
        {descricao}
      </p>
    </button>
  );
}

/* ============================= */
/* COR */
/* ============================= */

function ColorOption({
  cor,
  ativo,
  onClick,
}: {
  cor: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full ${cor} ${
        ativo
          ? "ring-2 ring-gray-900 ring-offset-2"
          : ""
      }`}
      title="Selecionar cor"
    >
      {ativo && (
        <Check
          size={16}
          className="text-white"
        />
      )}
    </button>
  );
}