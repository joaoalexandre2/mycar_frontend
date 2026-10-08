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
import { aplicarAparenciaSalva } from './utils/preferencias'
import { obterToken, obterUsuarioLogado } from './utils/authStorage'
import { ehConta, perfilDe } from './utils/perfil'

// Quem já está logado abre direto no visual escolhido (sem piscar); o login e
// o cadastro ficam sempre no visual padrão. O resto é cuidado pelo AparenciaDoUsuario.
if (obterToken()) {
  aplicarAparenciaSalva(ehConta(perfilDe(obterUsuarioLogado())))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
