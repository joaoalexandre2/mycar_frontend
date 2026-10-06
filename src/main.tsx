import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { aplicarAparenciaSalva } from './utils/preferencias'
import { obterToken } from './utils/authStorage'

// Quem já está logado abre direto no visual escolhido (sem piscar); o login e
// o cadastro ficam sempre no visual padrão. O resto é cuidado pelo AparenciaDoUsuario.
if (obterToken()) {
  aplicarAparenciaSalva()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
