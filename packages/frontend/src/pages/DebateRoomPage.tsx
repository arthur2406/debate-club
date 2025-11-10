import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Tag,
  Text,
} from '@chakra-ui/react'
import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import RoundTimer from '../components/RoundTimer'
import { useDebateFlow } from '../state/debateFlow'
import { useSession } from '../state/session'

const DebateRoomPage = () => {
  const navigate = useNavigate()
  const { session } = useSession()
  const {
    state: { selectedTopic, phase, participants, rounds, activeRoundIndex },
    advanceRound,
    resetDebate,
  } = useDebateFlow()

  useEffect(() => {
    if (!session) {
      navigate('/')
    }
  }, [session, navigate])

  if (!selectedTopic) {
    return <Navigate to="/topics" replace />
  }

  return (
    <Stack spacing={8}>
      <Stack spacing={3}>
        <Text textTransform="uppercase" fontWeight="bold" color="teal.500">
          Debate room
        </Text>
        <Heading size="lg">{selectedTopic}</Heading>
        <Text color="gray.500">
          Share the talking points, keep the timer visible, and guide your speakers through each
          round without missing a beat.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        <Box gridColumn={{ base: 'span 1', lg: 'span 2' }}>
          <RoundTimer />
        </Box>
        <Stack spacing={4} borderWidth="1px" borderRadius="lg" p={6} boxShadow="md">
          <Heading size="md">Participants</Heading>
          <Stack spacing={2}>
            {participants.length ? (
              participants.map((participant) => (
                <Tag key={participant} colorScheme="teal" size="lg" w="fit-content">
                  {participant}
                </Tag>
              ))
            ) : (
              <Text color="gray.500">Add participants from the topic selection step.</Text>
            )}
          </Stack>
          <Divider />
          <Stack spacing={3}>
            <Text fontWeight="semibold">Round summary</Text>
            <Stack spacing={2}>
              {rounds.map((round, index) => (
                <HStack key={round.id} justify="space-between" align="center">
                  <Text>{round.label}</Text>
                  <Tag colorScheme={index === activeRoundIndex ? 'teal' : 'gray'}>
                    {Math.round(round.duration / 60)} min
                  </Tag>
                </HStack>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </SimpleGrid>

      {phase === 'betweenRounds' ? (
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Stack spacing={1}>
            <AlertTitle>Ready for the next speaker?</AlertTitle>
            <AlertDescription>
              Take a brief pause to gather thoughts, then begin the next round when everyone is set.
            </AlertDescription>
          </Stack>
          <Button ml="auto" colorScheme="teal" onClick={advanceRound}>
            Start next round
          </Button>
        </Alert>
      ) : null}

      {phase === 'completed' ? (
        <Alert status="success" borderRadius="lg">
          <AlertIcon />
          <Stack spacing={1}>
            <AlertTitle>Debate complete</AlertTitle>
            <AlertDescription>
              Celebrate the insights shared and capture any notes before wrapping up.
            </AlertDescription>
          </Stack>
          <Button ml="auto" colorScheme="teal" variant="outline" onClick={() => navigate('/topics')}>
            Choose another topic
          </Button>
        </Alert>
      ) : null}

      <HStack>
        <Button variant="outline" onClick={() => navigate('/topics')}>
          Back to topics
        </Button>
        <Button
          variant="ghost"
          colorScheme="red"
          onClick={() => {
            resetDebate()
            navigate('/')
          }}
        >
          End session
        </Button>
      </HStack>
    </Stack>
  )
}

export default DebateRoomPage
