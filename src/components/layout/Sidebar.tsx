import {
    LayoutDashboard,
    Users,
    Car,
    Wrench,
    ClipboardList,
    Settings,
    LogOut,
  } from "lucide-react";
  import { NavLink, useNavigate } from "react-router-dom";
  import { useAuth } from "../../hooks/useAuth";
  
  interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    to: string;
  }
  
  function iniciais(nome?: string) {
    if (!nome) {
      return "?";
    }
  
    const partes = nome.trim().split(/\s+/);
  
    return (
      partes
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() ?? "")
        .join("") || "?"
    );
  }
  
  export function Sidebar() {
    const { usuario, sair } = useAuth();
    const navigate = useNavigate();
  
    async function handleLogout() {
      await sair();
      navigate("/login", { replace: true });
    }
  
    return (
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col bg-gray-900 px-4 py-6 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 pb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold">
            M
          </div>
  
          <span className="text-xl font-bold">
            MyCar
          </span>
        </div>
  
        {/* Menu */}
        <nav className="flex flex-col gap-1">
          <p className="mb-2 px-2 text-[10px] font-bold tracking-widest text-gray-500">
            MENU
          </p>
  
          <SidebarItem
            to="/"
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
          />
  
          <SidebarItem
            to="/clientes"
            icon={<Users size={19} />}
            label="Clientes"
          />
  
          <SidebarItem
            to="/veiculos"
            icon={<Car size={19} />}
            label="Veículos"
          />
  
          <SidebarItem
            to="/ordens-servico"
            icon={<ClipboardList size={19} />}
            label="Ordens de serviço"
          />
  
          <SidebarItem
            to="/manutencoes"
            icon={<Wrench size={19} />}
            label="Manutenções"
          />
  
          <p className="mb-2 mt-7 px-2 text-[10px] font-bold tracking-widest text-gray-500">
            SISTEMA
          </p>
  
          <SidebarItem
            to="/configuracoes"
            icon={<Settings size={19} />}
            label="Configurações"
          />
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
    );
  }
  
  function SidebarItem({
    icon,
    label,
    to,
  }: SidebarItemProps) {
    return (
      <NavLink
        to={to}
        end={to === "/"}
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
