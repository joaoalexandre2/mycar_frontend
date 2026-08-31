// import {
//   BrowserRouter,
//   Navigate,
//   Route,
//   Routes,
// } from "react-router-dom";

// import { Header } from "./components/layout/Header";
// import { Sidebar } from "./components/layout/Sidebar";

// import { Dashboard } from "./components/dashboard/Dashboard";

// import { Clientes } from "./pages/Clientes/Clientes";
// import { Veiculos } from "./pages/Veiculos/Veiculos";
// import { OrdensServico } from "./pages/OrdensServico/OrdensServico";
// import { Manutencoes } from "./pages/Manutencoes/Manutencoes";

// function Placeholder({
//   titulo,
// }: {
//   titulo: string;
// }) {
//   return (
//     <div className="p-8">
//       <h2 className="text-[21px] font-bold text-gray-900">
//         {titulo}
//       </h2>

//       <p className="mt-1 text-xs text-gray-500">
//         Esta área será desenvolvida em seguida.
//       </p>

//       <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center">
//         <p className="text-sm text-gray-400">
//           Em desenvolvimento...
//         </p>
//       </div>
//     </div>
//   );
// }

// function App() {
//   return (
//     <BrowserRouter>
//       <div className="min-h-screen bg-gray-50">
//         <Sidebar />

//         <main className="ml-[250px] min-h-screen">
//           <Header />

//           <Routes>
//             {/* Dashboard */}
//             <Route
//               path="/"
//               element={<Dashboard />}
//             />

//             {/* Clientes */}
//             <Route
//               path="/clientes"
//               element={<Clientes />}
//             />

//             {/* Veículos */}
//             <Route
//               path="/veiculos"
//               element={<Veiculos />}
//             />

//             {/* Ordens de serviço */}
//             <Route
//               path="/ordens-servico"
//               element={<OrdensServico />}
//             />

//             {/* Manutenções */}
//             <Route
//               path="/manutencoes"
//               element={
//                 <Placeholder titulo="Manutenções" />
//               }
//             />

//             {/* Configurações */}
//             <Route
//               path="/configuracoes"
//               element={
//                 <Placeholder titulo="Configurações" />
//               }
//             />

//             {/* Rota inexistente */}
//             <Route
//               path="*"
//               element={
//                 <Navigate
//                   to="/"
//                   replace
//                 />
//               }
//             />
//           </Routes>
//         </main>
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;


import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";

import { Dashboard } from "./components/dashboard/Dashboard";

import { Clientes } from "./pages/Clientes/Clientes";
import { Veiculos } from "./pages/Veiculos/Veiculos";
import { OrdensServico } from "./pages/OrdensServico/OrdensServico";
import { Manutencoes } from "./pages/Manutencoes/Manutencoes";
import { Configuracoes } from "./pages/Configuracoes/Configuracoes";

function Placeholder({
  titulo,
}: {
  titulo: string;
}) {
  return (
    <div className="p-8">
      <h2 className="text-[21px] font-bold text-gray-900">
        {titulo}
      </h2>

      <p className="mt-1 text-xs text-gray-500">
        Esta área será desenvolvida em seguida.
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-sm text-gray-400">
          Em desenvolvimento...
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <main className="ml-[250px] min-h-screen">
          <Header />

          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/clientes"
              element={<Clientes />}
            />

            <Route
              path="/veiculos"
              element={<Veiculos />}
            />

            <Route
              path="/ordens-servico"
              element={<OrdensServico />}
            />

            <Route
              path="/manutencoes"
              element={<Manutencoes />}
            />

            <Route
              path="/configuracoes"
              element={<Configuracoes />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;