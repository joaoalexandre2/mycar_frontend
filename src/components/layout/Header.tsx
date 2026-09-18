import {
    Bell,
    Search,
    CircleUserRound,
  } from "lucide-react";
  
  export function Header() {
    return (
      <header className="flex h-[82px] items-center justify-between border-b border-gray-200 bg-white px-8">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">
            Dashboard
          </h1>
  
          <p className="mt-0.5 text-xs text-gray-500">
            Visão geral do seu sistema automotivo.
          </p>
        </div>
  
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50">
            <Search size={19} />
          </button>
  
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50">
            <Bell size={19} />
  
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
  
          <div className="ml-1 flex items-center gap-2 text-gray-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              JK
            </div>
  
            <CircleUserRound size={18} />
          </div>
        </div>
      </header>
    );
  }