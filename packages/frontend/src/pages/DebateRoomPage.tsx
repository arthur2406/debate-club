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
  useToast,
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import RoundTimer from '../components/RoundTimer'
import { useDebateFlow } from '../state/debateFlow'
import { useSession } from '../state/session'
import {
  buildSignalingUrl,
  deleteWhipSession,
  fetchParticipants,
  fetchSession,
  publishWhipSession,
} from '../api/client'
import type { WhipSession } from '@debate-club/shared'

const mapServerPhaseToUi = (phase: string) => {
  if (phase === 'lobby') {
    return 'ready'
  }
  if (phase === 'feedback') {
    return 'completed'
  }
  return 'inRound'
}

const VideoTile = ({
  stream,
  label,
  muted,
}: {
  stream: MediaStream | null
  label: string
  muted?: boolean
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!videoRef.current) {
      return
    }
    if (stream) {
      videoRef.current.srcObject = stream
      void videoRef.current.play().catch(() => undefined)
    } else {
      videoRef.current.srcObject = null
    }
  }, [stream])

  return (
    <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={3} boxShadow="sm">
      <Box position="relative" borderRadius="md" overflow="hidden" bg="blackAlpha.700">
        <video ref={videoRef} autoPlay playsInline muted={muted} style={{ width: '100%' }} />
      </Box>
      <Text fontWeight="semibold" noOfLines={1} title={label}>
        {label}
      </Text>
    </Stack>
  )
}

const DebateRoomPage = () => {
  const navigate = useNavigate()
  const { session } = useSession()
  const {
    state: { selectedTopic, phase, participants, rounds, activeRoundIndex, backendSession },
    setParticipants,
    syncPhase,
    resetDebate,
  } = useDebateFlow()
  const toast = useToast()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const participantSessionsRef = useRef<Record<string, WhipSession>>({})
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({})
  const socketRef = useRef<WebSocket | null>(null)
  const heartbeatRef = useRef<number | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  useEffect(() => {
    if (!session) {
      navigate('/')
    }
  }, [session, navigate])

  useEffect(() => {
    if (!backendSession && session) {
      navigate('/topics')
    }
  }, [backendSession, session, navigate])

  const computeTimeRemaining = useCallback((endsAt?: string, durationMs?: number | null) => {
    if (endsAt) {
      return Math.max(0, Math.round((new Date(endsAt).getTime() - Date.now()) / 1000))
    }
    if (durationMs) {
      return Math.round(durationMs / 1000)
    }
    return null
  }, [])

  const updateParticipantState = useCallback(
    (nextSessions: Record<string, WhipSession>) => {
      participantSessionsRef.current = nextSessions
      const ordered = Object.values(nextSessions).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      )
      const names: Record<string, string> = {}
      ordered.forEach((entry) => {
        const displayName =
          entry.participantId === session?.id
            ? session.name
            : (entry.metadata?.displayName as string) ?? `Participant ${entry.participantId.slice(0, 6)}`
        names[entry.participantId] = displayName
      })
      setParticipantNames(names)
      setParticipants(ordered.map((entry) => names[entry.participantId]))
    },
    [session?.id, session?.name, setParticipants],
  )

  const getParticipantName = useCallback(
    (participantId: string) =>
      participantNames[participantId] ??
      (participantId === session?.id ? session.name : `Participant ${participantId.slice(0, 6)}`),
    [participantNames, session?.id, session?.name],
  )

  useEffect(() => {
    if (!backendSession || !session) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop())
          return
        }
        setLocalStream(media)
      } catch (error) {
        console.error('Failed to access media devices', error)
        toast({
          title: 'Camera or microphone unavailable',
          description: 'Grant permissions to share audio and video.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        })
      }
    })()
    return () => {
      cancelled = true
      setLocalStream((current) => {
        current?.getTracks().forEach((track) => track.stop())
        return null
      })
    }
  }, [backendSession, session, toast])

  useEffect(() => {
    if (!backendSession || !session) {
      return
    }
    let active = true
    ;(async () => {
      try {
        await publishWhipSession({
          sessionId: backendSession.id,
          participantId: session.id,
          sdpOffer: 'browser-client',
          clientCapabilities: { displayName: session.name },
        })
        if (!active) {
          return
        }
        const [participantsResponse, sessionState] = await Promise.all([
          fetchParticipants(backendSession.id),
          fetchSession(backendSession.id),
        ])
        if (!active) {
          return
        }
        const nextSessions: Record<string, WhipSession> = {}
        participantsResponse.forEach((item) => {
          nextSessions[item.participantId] = item
        })
        updateParticipantState(nextSessions)
        const uiPhase = mapServerPhaseToUi(sessionState.currentPhase)
        const roundIndex = rounds.findIndex((round) => round.id === sessionState.currentPhase)
        const timeRemaining = computeTimeRemaining(
          sessionState.roundTiming?.endsAt,
          sessionState.roundTiming?.durationMs,
        )
        syncPhase(
          uiPhase,
          roundIndex >= 0 ? roundIndex : null,
          timeRemaining,
          sessionState.roundTiming ?? null,
          sessionState,
        )
      } catch (error) {
        console.error('Failed to register with session', error)
        toast({
          title: 'Unable to join debate session',
          description: error instanceof Error ? error.message : undefined,
          status: 'error',
          duration: 3500,
          isClosable: true,
        })
      }
    })()
    return () => {
      active = false
      deleteWhipSession(backendSession.id, session.id).catch(() => undefined)
    }
  }, [backendSession, session, toast, updateParticipantState, rounds, computeTimeRemaining, syncPhase])

  useEffect(() => {
    if (!backendSession || !session || !localStream) {
      return
    }

    const url = buildSignalingUrl(backendSession.id, session.id)
    const socket = new WebSocket(url)
    socketRef.current = socket

    const send = (payload: unknown) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload))
      }
    }

    const createPeerConnection = (remoteId: string) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          send({ type: 'ice', to: remoteId, candidate: event.candidate })
        }
      }
      pc.ontrack = (event) => {
        const [stream] = event.streams
        if (stream) {
          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.set(remoteId, stream)
            return next
          })
        }
      }
      pc.onconnectionstatechange = () => {
        if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.delete(remoteId)
            return next
          })
          pc.close()
          peersRef.current.delete(remoteId)
        }
      }
      return pc
    }

    const ensurePeer = (remoteId: string) => {
      let peer = peersRef.current.get(remoteId)
      if (!peer) {
        peer = createPeerConnection(remoteId)
        peersRef.current.set(remoteId, peer)
      }
      return peer
    }

    const initiateOffer = async (remoteId: string) => {
      try {
        const peer = ensurePeer(remoteId)
        if (!peer) {
          return
        }
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        send({ type: 'offer', to: remoteId, description: offer })
      } catch (error) {
        console.error('Failed to create offer', error)
      }
    }

    socket.onopen = () => {
      send({ type: 'heartbeat' })
      heartbeatRef.current = window.setInterval(() => send({ type: 'heartbeat' }), 15000)
      const existingParticipants = Object.keys(participantSessionsRef.current)
      existingParticipants
        .filter((id) => id !== session.id)
        .forEach((participantId) => {
          if (!peersRef.current.has(participantId)) {
            void initiateOffer(participantId)
          }
        })
    }

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.payload) {
          if (data.type === 'participant-joined') {
            const participant: WhipSession = data.payload
            const next = { ...participantSessionsRef.current, [participant.participantId]: participant }
            updateParticipantState(next)
            if (participant.participantId !== session.id) {
              void initiateOffer(participant.participantId)
            }
            return
          }
          if (data.type === 'participant-left') {
            const { participantId } = data.payload as { participantId: string }
            const next = { ...participantSessionsRef.current }
            delete next[participantId]
            updateParticipantState(next)
            const peer = peersRef.current.get(participantId)
            if (peer) {
              peer.close()
              peersRef.current.delete(participantId)
            }
            setRemoteStreams((prev) => {
              const nextStreams = new Map(prev)
              nextStreams.delete(participantId)
              return nextStreams
            })
            return
          }
          if (data.type === 'phase') {
            const sessionState = await fetchSession(backendSession.id)
            const uiPhase = mapServerPhaseToUi(sessionState.currentPhase)
            const roundIndex = rounds.findIndex((round) => round.id === sessionState.currentPhase)
            const timeRemaining = computeTimeRemaining(
              sessionState.roundTiming?.endsAt,
              sessionState.roundTiming?.durationMs,
            )
            syncPhase(
              uiPhase,
              roundIndex >= 0 ? roundIndex : null,
              timeRemaining,
              sessionState.roundTiming ?? null,
              sessionState,
            )
            return
          }
          if (data.type === 'ice') {
            return
          }
        }

        if (data.type === 'offer') {
          const peer = ensurePeer(data.from)
          await peer.setRemoteDescription(data.description)
          const answer = await peer.createAnswer()
          await peer.setLocalDescription(answer)
          send({ type: 'answer', to: data.from, description: answer })
          return
        }

        if (data.type === 'answer') {
          const peer = peersRef.current.get(data.from)
          if (peer) {
            await peer.setRemoteDescription(data.description)
          }
          return
        }

        if (data.type === 'ice') {
          const peer = peersRef.current.get(data.from)
          if (peer && data.candidate) {
            try {
              await peer.addIceCandidate(data.candidate)
            } catch (error) {
              console.error('Failed to apply ICE candidate', error)
            }
          }
        }
      } catch (error) {
        console.error('Invalid signaling message', error)
      }
    }

    const cleanup = () => {
      socketRef.current = null
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }

    socket.onclose = cleanup
    socket.onerror = cleanup

    return () => {
      cleanup()
      socket.close()
    }
  }, [backendSession, session, localStream, updateParticipantState, rounds, computeTimeRemaining, syncPhase])

  useEffect(() => {
    return () => {
      peersRef.current.forEach((peer) => peer.close())
      peersRef.current.clear()
      setRemoteStreams(new Map())
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [])

  const remoteStreamEntries = useMemo(() => Array.from(remoteStreams.entries()), [remoteStreams])

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
        <Stack spacing={4} gridColumn={{ base: 'span 1', lg: 'span 2' }}>
          <RoundTimer />
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <VideoTile stream={localStream} label={`${session?.name ?? 'You'} (You)`} muted />
            {remoteStreamEntries.length === 0 ? (
              <Stack
                borderWidth="1px"
                borderRadius="lg"
                p={6}
                spacing={3}
                align="center"
                justify="center"
                minH="200px"
                color="gray.500"
              >
                <Text>Waiting for other participants to join…</Text>
              </Stack>
            ) : (
              remoteStreamEntries.map(([participantId, stream]) => (
                <VideoTile key={participantId} stream={stream} label={getParticipantName(participantId)} />
              ))
            )}
          </SimpleGrid>
        </Stack>
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
              <Text color="gray.500">Waiting for participants to join.</Text>
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
