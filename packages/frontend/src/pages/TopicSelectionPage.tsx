import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopicCard from '../components/TopicCard'
import { useDebateFlow } from '../state/debateFlow'
import { useSession } from '../state/session'

const curatedTopics = [
  {
    title: 'Technology & Society',
    description: 'Should AI assistants be regulated as public utilities?',
  },
  {
    title: 'Climate Policy',
    description: 'Is a carbon tax the most effective tool to reduce emissions?',
  },
  {
    title: 'Education Reform',
    description: 'Should universities eliminate standardized testing requirements?',
  },
  {
    title: 'Global Governance',
    description: 'Do international sanctions achieve more harm than good?',
  },
  {
    title: 'Ethics in Science',
    description: 'Should genetic editing be available for non-medical enhancements?',
  },
  {
    title: 'Media Literacy',
    description: 'Are social media platforms responsible for fact-checking content?',
  },
]

const durationOptions = [
  { label: '1 minute rounds', value: 60 },
  { label: '2 minute rounds', value: 120 },
  { label: '3 minute rounds', value: 180 },
]

const TopicSelectionPage = () => {
  const navigate = useNavigate()
  const { session } = useSession()
  const {
    state: { selectedTopic, phase, rounds },
    beginTopicSelection,
    selectTopic,
    setParticipants,
    setRoundDuration,
    startDebate,
  } = useDebateFlow()
  const [opponent, setOpponent] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [localSelection, setLocalSelection] = useState(selectedTopic ?? '')
  const [selectedDuration, setSelectedDuration] = useState(rounds[0]?.duration ?? 120)

  useEffect(() => {
    beginTopicSelection()
  }, [beginTopicSelection])

  useEffect(() => {
    if (!session) {
      navigate('/')
    }
  }, [session, navigate])

  useEffect(() => {
    if (selectedTopic) {
      setLocalSelection(selectedTopic)
    }
  }, [selectedTopic])

  useEffect(() => {
    if (rounds[0]) {
      setSelectedDuration(rounds[0].duration)
    }
  }, [rounds])

  const canStart = useMemo(() => Boolean(localSelection && session), [localSelection, session])

  const handleTopicSelect = (topic: string) => {
    setLocalSelection(topic)
    selectTopic(topic)
  }

  const handleCustomTopic = () => {
    const trimmed = customTopic.trim()
    if (!trimmed) {
      return
    }
    handleTopicSelect(trimmed)
    setCustomTopic('')
  }

  const handleDurationChange = (value: number) => {
    setSelectedDuration(value)
    setRoundDuration(value)
  }

  const handleStartDebate = () => {
    if (!session || !localSelection) {
      return
    }
    const participants = [session.name]
    if (opponent.trim()) {
      participants.push(opponent.trim())
    }
    setParticipants(participants)
    // round duration already synced via handleDurationChange
    startDebate()
    navigate('/debate')
  }

  return (
    <Stack spacing={10}>
      <VStack align="flex-start" spacing={3}>
        <Text textTransform="uppercase" fontWeight="bold" color="teal.500">
          Step 1
        </Text>
        <Text fontSize="3xl" fontWeight="bold">
          Choose a topic to explore
        </Text>
        <Text color="gray.500">
          Select one of the curated prompts or propose your own to kickstart the debate.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {curatedTopics.map((topic) => (
          <TopicCard
            key={topic.title}
            topic={topic.title}
            description={topic.description}
            isSelected={localSelection === topic.title}
            onSelect={() => handleTopicSelect(topic.title)}
          />
        ))}
      </SimpleGrid>

      <Box borderWidth="1px" borderRadius="lg" p={6} boxShadow="md">
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Custom topic</FormLabel>
            <HStack>
              <Input
                placeholder="e.g. Should cities ban private cars from downtown?"
                value={customTopic}
                onChange={(event) => setCustomTopic(event.target.value)}
              />
              <Button onClick={handleCustomTopic}>Add topic</Button>
            </HStack>
          </FormControl>
          <FormControl>
            <FormLabel>Round duration</FormLabel>
            <Select value={selectedDuration} onChange={(event) => handleDurationChange(Number(event.target.value))}>
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Opponent or teammate name (optional)</FormLabel>
            <Input
              placeholder="Add another participant"
              value={opponent}
              onChange={(event) => setOpponent(event.target.value)}
            />
          </FormControl>
        </Stack>
      </Box>

      <Box borderWidth="1px" borderRadius="lg" p={6} boxShadow="sm">
        <Stack direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
          <Box>
            <Text fontWeight="semibold">Selected topic</Text>
            <Text color="gray.500">{localSelection || 'No topic selected yet'}</Text>
          </Box>
          <HStack spacing={3}>
            <Badge colorScheme={phase === 'ready' ? 'green' : 'gray'}>{phase}</Badge>
            <Button colorScheme="teal" size="lg" onClick={handleStartDebate} isDisabled={!canStart}>
              Launch debate room
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Stack>
  )
}

export default TopicSelectionPage
