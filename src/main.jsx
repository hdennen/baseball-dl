import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StytchProvider } from '@stytch/react'
import { StytchUIClient } from '@stytch/vanilla-js'
import App from './App.jsx'
import { CssBaseline } from '@mui/material'

const stytchClient = new StytchUIClient(
  import.meta.env.VITE_STYTCH_PUBLIC_TOKEN
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StytchProvider stytch={stytchClient}>
      <BrowserRouter>
        <CssBaseline />
        <App />
      </BrowserRouter>
    </StytchProvider>
  </React.StrictMode>,
)

