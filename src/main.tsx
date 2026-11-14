import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NotificacoesProvider } from './contexts/NotificacoesProvider'
import '@fontsource/figtree/latin-400.css'
import '@fontsource/figtree/latin-500.css'
import '@fontsource/figtree/latin-600.css'
import '@fontsource/figtree/latin-700.css'
import { aplicarAparenciaSalva, estiloDoPerfil } from './utils/preferencias'
import { apagarTokenAntigo, estaLogado, obterUsuarioLogado } from './utils/authStorage'

// Versões antigas guardavam o token no aparelho; ele sai daqui, já que a sessão agora é o cookie.
apagarTokenAntigo()

// Quem já está logado abre direto no visual escolhido (sem piscar); o login e
// o cadastro ficam sempre no visual padrão. O resto é cuidado pelo AparenciaDoUsuario.
if (estaLogado()) {
  aplicarAparenciaSalva(estiloDoPerfil(obterUsuarioLogado()))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificacoesProvider>
      <App />
    </NotificacoesProvider>
  </StrictMode>,
)
