import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StytchProvider } from '@stytch/react'
import { ApolloProvider } from '@apollo/client/react'
import { apolloClient } from './graphql/client'
import { stytchClient } from './stytchClient'
import App from './App'
import { CssBaseline } from '@mui/material'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StytchProvider stytch={stytchClient}>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <CssBaseline />
          <App />
        </BrowserRouter>
      </ApolloProvider>
    </StytchProvider>
  </React.StrictMode>,
)

