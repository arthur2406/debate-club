import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  IconButton,
  Spacer,
  Text,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { Link as RouterLink, NavLink, Outlet } from 'react-router-dom'
import { useSession } from '../state/session'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Topics', to: '/topics' },
  { label: 'Debate Room', to: '/debate' },
]

const AppLayout = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const headerBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const { session, clearSession } = useSession()

  return (
    <Flex direction="column" minH="100vh">
      <Box as="header" bg={headerBg} borderBottomWidth="1px" borderColor={borderColor} py={4}>
        <Container maxW="6xl">
          <HStack spacing={6} align="center">
            <Heading size="md" as={RouterLink} to="/">
              Debate Club
            </Heading>
            <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <Button
                      size="sm"
                      variant={isActive ? 'solid' : 'ghost'}
                      colorScheme={isActive ? 'teal' : undefined}
                    >
                      {link.label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </HStack>
            <Spacer />
            {session ? (
              <HStack spacing={3}>
                <Box textAlign="right">
                  <Text fontSize="sm" fontWeight="medium">
                    {session.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {session.isGuest ? 'Guest' : 'Member'}
                  </Text>
                </Box>
                <Button size="sm" variant="outline" onClick={clearSession}>
                  Sign out
                </Button>
              </HStack>
            ) : (
              <Button as={RouterLink} to="/" size="sm" variant="outline">
                Sign in
              </Button>
            )}
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
            />
          </HStack>
        </Container>
      </Box>
      <Box as="main" flex="1" py={{ base: 8, md: 12 }}>
        <Container maxW="6xl">
          <Outlet />
        </Container>
      </Box>
      <Box as="footer" py={6} borderTopWidth="1px" borderColor={borderColor}>
        <Container maxW="6xl">
          <Text fontSize="sm" color="gray.500">
            Built with passion for thoughtful debates.
          </Text>
        </Container>
      </Box>
    </Flex>
  )
}

export default AppLayout
