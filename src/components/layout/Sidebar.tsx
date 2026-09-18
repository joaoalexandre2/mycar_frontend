import {
    LayoutDashboard,
    Users,
    Car,
    Wrench,
    ClipboardList,
    Settings,
  } from "lucide-react";
  import { NavLink } from "react-router-dom";
  
  interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    to: string;
  }
  
  export function Sidebar() {
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              JK
            </div>
  
            <div className="flex min-w-0 flex-col">
              <strong className="truncate text-xs">
                João Kirst
              </strong>
  
              <span className="text-[11px] text-gray-500">
                Administrador
              </span>
            </div>
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