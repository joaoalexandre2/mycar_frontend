import {
    LayoutDashboard,
    Users,
    Car,
    Wrench,
    Package,
    ClipboardList,
    Settings,
    ShieldCheck,
    LogOut,
    X,
  } from "lucide-react";
  import { NavLink, useNavigate } from "react-router-dom";
  import { useAuth } from "../../hooks/useAuth";
  import { iniciais } from "../../utils/iniciais";
  import { ehConta, perfilDe } from "../../utils/perfil";

  interface SidebarProps {
    aberta: boolean;
    aoFechar: () => void;
  }

  interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    to: string;
    aoNavegar: () => void;
  }

  export function Sidebar({ aberta, aoFechar }: SidebarProps) {
    const { usuario, sair } = useAuth();
    const navigate = useNavigate();
    const perfil = perfilDe(usuario);

    async function handleLogout() {
      await sair();
      navigate("/login", { replace: true });
    }

    return (
      <>
        {aberta && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={aoFechar}
          />
        )}

        <aside
          className={`print:hidden fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col bg-gray-900 px-4 py-6 text-white transition-transform duration-200 md:translate-x-0 ${
            aberta ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between gap-3 px-2 pb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold">
                M
              </div>

              <div className="flex flex-col leading-tight">
                <span className="text-xl font-bold">
                  MyCar
                </span>

                {perfil !== "oficina" && (
                  <span className="text-[10px] text-gray-400">
                    {perfil === "pessoa" ? "Cuidados com seu carro" : "Frota"}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={aoFechar}
              title="Fechar menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-800 hover:text-white md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex flex-col gap-1">
            <p className="mb-2 px-2 text-[10px] font-bold tracking-widest text-gray-500">
              MENU
            </p>

            {ehConta(perfil) ? (
              <>
                <SidebarItem
                  to="/"
                  icon={<LayoutDashboard size={19} />}
                  label="Início"
                  aoNavegar={aoFechar}
                />

                <SidebarItem
                  to="/veiculos"
                  icon={<Car size={19} />}
                  label={perfil === "frota" ? "Veículos da frota" : "Meus veículos"}
                  aoNavegar={aoFechar}
                />

                <SidebarItem
                  to="/servicos"
                  icon={<Wrench size={19} />}
                  label="Serviços"
                  aoNavegar={aoFechar}
                />

                <SidebarItem
                  to="/pecas"
                  icon={<Package size={19} />}
                  label="Peças"
                  aoNavegar={aoFechar}
                />

                <SidebarItem
                  to="/ficha-tecnica"
                  icon={<ClipboardList size={19} />}
                  label="Ficha técnica"
                  aoNavegar={aoFechar}
                />
              </>
            ) : (
              <>
                <SidebarItem
                  to="/"
                  icon={<LayoutDashboard size={19} />}
                  label="Dashboard"
                  aoNavegar={aoFechar}
                />

                <SidebarItem
                  to="/clientes"
                  icon={<Users size={19} />}
                  label="Clientes"
                  aoNavegar={aoFechar}
                />

                <SidebarItem
                  to="/veiculos"
                  icon={<Car size={19} />}
                  label="Veículos"
                  aoNavegar={aoFechar}
                />

                <SidebarItem
                  to="/ordens-servico"
                  icon={<ClipboardList size={19} />}
                  label="Ordens de serviço"
                  aoNavegar={aoFechar}
                />

                <SidebarItem
                  to="/manutencoes"
                  icon={<Wrench size={19} />}
                  label="Manutenções"
                  aoNavegar={aoFechar}
                />
              </>
            )}

            <p className="mb-2 mt-7 px-2 text-[10px] font-bold tracking-widest text-gray-500">
              SISTEMA
            </p>

            <SidebarItem
              to="/configuracoes"
              icon={<Settings size={19} />}
              label="Configurações"
              aoNavegar={aoFechar}
            />

            {usuario?.admin && (
              <SidebarItem
                to="/admin"
                icon={<ShieldCheck size={19} />}
                label="Administração"
                aoNavegar={aoFechar}
              />
            )}
          </nav>

          {/* Usuário */}
          <div className="mt-auto border-t border-gray-800 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {iniciais(usuario?.name)}
              </div>

              <div className="flex min-w-0 flex-col">
                <strong className="truncate text-xs">
                  {usuario?.name ?? "Usuário"}
                </strong>

                <span className="truncate text-[11px] text-gray-500">
                  {usuario?.email ?? ""}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sair"
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-800 hover:text-white"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  function SidebarItem({
    icon,
    label,
    to,
    aoNavegar,
  }: SidebarItemProps) {
    return (
      <NavLink
        to={to}
        end={to === "/"}
        onClick={aoNavegar}
        className={({ isActive }) =>
          `flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm transition ${
            isActive
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`
        }
      >
        {icon}

        <span>{label}</span>
      </NavLink>
    );
  }
