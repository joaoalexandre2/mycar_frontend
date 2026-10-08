import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-500.css'
import '@fontsource/barlow/latin-600.css'
import '@fontsource/barlow-condensed/latin-500.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/public-sans/latin-400.css'
import '@fontsource/public-sans/latin-500.css'
import '@fontsource/public-sans/latin-600.css'
import '@fontsource/public-sans/latin-700.css'
import { aplicarAparenciaSalva, estiloDoPerfil } from './utils/preferencias'
import { obterToken, obterUsuarioLogado } from './utils/authStorage'

// Quem já está logado abre direto no visual escolhido (sem piscar); o login e
// o cadastro ficam sempre no visual padrão. O resto é cuidado pelo AparenciaDoUsuario.
if (obterToken()) {
  aplicarAparenciaSalva(estiloDoPerfil(obterUsuarioLogado()))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
