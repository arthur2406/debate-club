import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import App from './App.tsx'
import { DebateProvider } from './state/debateFlow'
import { SessionProvider } from './state/session'
import theme from './theme'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <SessionProvider>
        <DebateProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DebateProvider>
      </SessionProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
