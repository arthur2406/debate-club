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
  useToast,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopicCard from '../components/TopicCard'
import { useDebateFlow } from '../state/debateFlow'
import { useSession } from '../state/session'
import type { DebateTopic } from '@debate-club/shared'
import { createSession, fetchTopics } from '../api/client'

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

const createFallbackTopics = (): DebateTopic[] =>
  curatedTopics.map((topic, index) => ({
    id: `fallback-${index}`,
    title: topic.title,
    description: topic.description,
    tags: [],
    createdAt: new Date(2024, 0, index + 1).toISOString(),
    updatedAt: new Date(2024, 0, index + 1).toISOString(),
  }))

const TopicSelectionPage = () => {
  const navigate = useNavigate()
  const { session } = useSession()
  const {
    state: { selectedTopic, phase, rounds },
    beginTopicSelection,
    selectTopic,
    setParticipants,
    setRoundDuration,
    setBackendSession,
  } = useDebateFlow()
  const [opponent, setOpponent] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [topicOptions, setTopicOptions] = useState<DebateTopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(rounds[0]?.duration ?? 120)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const toast = useToast()

  useEffect(() => {
    beginTopicSelection()
  }, [beginTopicSelection])

  useEffect(() => {
    if (!session) {
      navigate('/')
    }
  }, [session, navigate])

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const topics = await fetchTopics()
        if (!isMounted) {
          return
        }
        if (topics.length === 0) {
          setTopicOptions(createFallbackTopics())
        } else {
          setTopicOptions(topics)
        }
      } catch (error) {
        console.error('Failed to load topics', error)
        if (!isMounted) {
          return
        }
        toast({
          title: 'Unable to load topics',
          description: 'Using curated defaults temporarily.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        setTopicOptions(createFallbackTopics())
      }
    })()
    return () => {
      isMounted = false
    }
  }, [toast])

  useEffect(() => {
    if (selectedTopic && topicOptions.length) {
      const found = topicOptions.find((topic) => topic.title === selectedTopic)
      if (found) {
        setSelectedTopicId(found.id)
      }
    }
  }, [selectedTopic, topicOptions])

  useEffect(() => {
    if (rounds[0]) {
      setSelectedDuration(rounds[0].duration)
    }
  }, [rounds])

  const canStart = useMemo(() => Boolean(selectedTopicId && session), [selectedTopicId, session])

  const handleTopicSelect = (topic: DebateTopic) => {
    setSelectedTopicId(topic.id)
    selectTopic(topic.title)
  }

  const handleCustomTopic = () => {
    const trimmed = customTopic.trim()
    if (!trimmed) {
      return
    }
    const newTopic: DebateTopic = {
      id: `custom-${Date.now()}`,
      title: trimmed,
      description: 'Custom topic',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTopicOptions((prev) => [newTopic, ...prev])
    handleTopicSelect(newTopic)
    setCustomTopic('')
  }

  const handleDurationChange = (value: number) => {
    setSelectedDuration(value)
    setRoundDuration(value)
  }

  const handleStartDebate = async () => {
    if (!session || !selectedTopicId) {
      return
    }

    const topic = topicOptions.find((item) => item.id === selectedTopicId)
    if (!topic) {
      toast({
        title: 'Select a topic',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      })
      return
    }

    setIsCreatingSession(true)
    try {
      const backendSession = await createSession(topic.id, [session.id])
      setBackendSession(backendSession)
      setParticipants([session.name, ...(opponent.trim() ? [opponent.trim()] : [])])
      navigate('/debate')
    } catch (error) {
      console.error('Failed to create session', error)
      toast({
        title: 'Could not create session',
        description: error instanceof Error ? error.message : undefined,
        status: 'error',
        duration: 3500,
        isClosable: true,
      })
    } finally {
      setIsCreatingSession(false)
    }
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
        {topicOptions.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic.title}
            description={topic.description}
            isSelected={selectedTopicId === topic.id}
            onSelect={() => handleTopicSelect(topic)}
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
            <Text color="gray.500">
              {selectedTopicId
                ? topicOptions.find((topic) => topic.id === selectedTopicId)?.title ?? 'Custom topic'
                : 'No topic selected yet'}
            </Text>
          </Box>
          <HStack spacing={3}>
            <Badge colorScheme={phase === 'ready' ? 'green' : 'gray'}>{phase}</Badge>
            <Button
              colorScheme="teal"
              size="lg"
              onClick={handleStartDebate}
              isDisabled={!canStart || isCreatingSession}
              isLoading={isCreatingSession}
              loadingText="Starting"
            >
              Launch debate room
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Stack>
  )
}

export default TopicSelectionPage
