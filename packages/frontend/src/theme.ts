import { extendTheme, ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  styles: {
    global: {
      'html, body': {
        minHeight: '100%',
        backgroundColor: 'gray.50',
        _dark: {
          backgroundColor: 'gray.900',
        },
      },
      body: {
        color: 'gray.800',
        _dark: {
          color: 'gray.100',
        },
      },
    },
  },
})

export default theme
