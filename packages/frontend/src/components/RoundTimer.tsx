import { Badge, Box, HStack, Progress, Stack, Text } from '@chakra-ui/react'
import { useEffect, useMemo } from 'react'
import { useDebateFlow } from '../state/debateFlow'

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const RoundTimer = () => {
  const {
    state: { phase, timeRemaining, rounds, activeRoundIndex },
    tick,
  } = useDebateFlow()

  const currentRound = useMemo(
    () => (activeRoundIndex !== null ? rounds[activeRoundIndex] : undefined),
    [activeRoundIndex, rounds],
  )

  useEffect(() => {
    if (phase !== 'inRound' || !timeRemaining) {
      return
    }
    const interval = window.setInterval(() => tick(1), 1000)
    return () => window.clearInterval(interval)
  }, [phase, timeRemaining, tick])

  if (!currentRound) {
    return null
  }

  const total = currentRound.duration
  const remaining = timeRemaining ?? total
  const progress = ((total - remaining) / total) * 100

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} boxShadow="md">
      <Stack spacing={3}>
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="semibold">
            {currentRound.label}
          </Text>
          <Badge colorScheme={phase === 'inRound' ? 'green' : 'purple'}>{phase}</Badge>
        </HStack>
        <Text fontSize="4xl" fontWeight="bold" textAlign="center">
          {formatTime(remaining)}
        </Text>
        <Progress value={progress} colorScheme="teal" borderRadius="full" />
      </Stack>
    </Box>
  )
}

export default RoundTimer
