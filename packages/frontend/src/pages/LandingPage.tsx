import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../state/session'

const features = [
  {
    title: 'Guided Debate Rounds',
    description: 'Stay on track with structured phases and smart timers.',
  },
  {
    title: 'Topic Inspiration',
    description: 'Choose from curated prompts or craft your own.',
  },
  {
    title: 'Team Collaboration',
    description: 'Coordinate speakers and track participation effortlessly.',
  },
]

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `guest-${Math.random().toString(36).slice(2, 10)}`
}

const LandingPage = () => {
  const { session, setSession } = useSession()
  const [name, setName] = useState(session?.isGuest ? '' : session?.name ?? '')
  const navigate = useNavigate()
  const toast = useToast()

  const handleContinue = (asGuest = false) => {
    const trimmed = name.trim()
    const isGuest = asGuest || trimmed.length === 0
    const displayName = isGuest ? 'Guest Debater' : trimmed

    if (!displayName) {
      toast({
        title: 'Enter a display name',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      })
      return
    }

    setSession({
      id: session?.id ?? generateId(),
      name: displayName,
      isGuest,
      createdAt: session?.createdAt ?? new Date().toISOString(),
    })
    navigate('/topics')
  }

  return (
    <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={12}>
      <Stack spacing={6} flex="1">
        <Box>
          <Heading size="2xl" mb={4}>
            Debate fearlessly with a guided, modern workspace.
          </Heading>
          <Text fontSize="lg" color="gray.500">
            Orchestrate rounds, keep time, and collaborate with teammates—all in a
            clean interface crafted for debate clubs and competitive speakers.
          </Text>
        </Box>
        <Stack spacing={4} direction={{ base: 'column', sm: 'row' }}>
          <Input
            placeholder="Your display name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            size="lg"
          />
          <Button colorScheme="teal" size="lg" onClick={() => handleContinue(false)}>
            Enter the club
          </Button>
        </Stack>
        <Button variant="ghost" alignSelf="flex-start" onClick={() => handleContinue(true)}>
          Continue as guest
        </Button>
      </Stack>
      <Box flex="1" w="full">
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
          {features.map((feature) => (
            <Box key={feature.title} borderRadius="xl" borderWidth="1px" p={6} boxShadow="md">
              <Stack spacing={2}>
                <Heading size="md">{feature.title}</Heading>
                <Text color="gray.500">{feature.description}</Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Flex>
  )
}

export default LandingPage
