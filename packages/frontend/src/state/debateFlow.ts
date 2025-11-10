import { createContext, createElement, ReactNode, useCallback, useContext, useMemo, useReducer } from 'react'

export type DebatePhase = 'idle' | 'topicSelection' | 'ready' | 'inRound' | 'betweenRounds' | 'completed'

export interface DebateRound {
  id: string
  label: string
  duration: number
}

export interface DebateState {
  phase: DebatePhase
  selectedTopic?: string
  rounds: DebateRound[]
  activeRoundIndex: number | null
  timeRemaining: number | null
  participants: string[]
}

const defaultRounds: DebateRound[] = [
  { id: 'opening', label: 'Opening Statements', duration: 180 },
  { id: 'rebuttal', label: 'Rebuttal', duration: 120 },
  { id: 'closing', label: 'Closing Arguments', duration: 120 },
]

const initialState: DebateState = {
  phase: 'idle',
  selectedTopic: undefined,
  rounds: defaultRounds,
  activeRoundIndex: null,
  timeRemaining: null,
  participants: [],
}

type DebateAction =
  | { type: 'beginTopicSelection' }
  | { type: 'selectTopic'; topic: string }
  | { type: 'setParticipants'; participants: string[] }
  | { type: 'setRoundDuration'; duration: number }
  | { type: 'startDebate' }
  | { type: 'advanceRound' }
  | { type: 'tick'; delta?: number }
  | { type: 'reset' }

const reducer = (state: DebateState, action: DebateAction): DebateState => {
  switch (action.type) {
    case 'beginTopicSelection':
      return {
        ...state,
        phase: 'topicSelection',
      }
    case 'selectTopic':
      return {
        ...state,
        selectedTopic: action.topic,
        phase: 'ready',
      }
    case 'setParticipants':
      return {
        ...state,
        participants: action.participants,
      }
    case 'setRoundDuration':
      return {
        ...state,
        rounds: state.rounds.map((round) => ({ ...round, duration: action.duration })),
      }
    case 'startDebate': {
      if (!state.selectedTopic || state.rounds.length === 0) {
        return state
      }
      return {
        ...state,
        phase: 'inRound',
        activeRoundIndex: 0,
        timeRemaining: state.rounds[0].duration,
      }
    }
    case 'advanceRound': {
      if (state.rounds.length === 0) {
        return state
      }
      const nextIndex = state.activeRoundIndex === null ? 0 : state.activeRoundIndex + 1
      if (nextIndex >= state.rounds.length) {
        return {
          ...state,
          phase: 'completed',
          activeRoundIndex: null,
          timeRemaining: 0,
        }
      }
      return {
        ...state,
        phase: 'inRound',
        activeRoundIndex: nextIndex,
        timeRemaining: state.rounds[nextIndex].duration,
      }
    }
    case 'tick': {
      if (state.phase !== 'inRound' || state.timeRemaining === null) {
        return state
      }
      const delta = action.delta ?? 1
      const nextTime = Math.max(0, state.timeRemaining - delta)
      if (nextTime === 0) {
        const isLastRound =
          state.activeRoundIndex === null || state.activeRoundIndex >= state.rounds.length - 1
        return {
          ...state,
          phase: isLastRound ? 'completed' : 'betweenRounds',
          timeRemaining: 0,
          activeRoundIndex: isLastRound ? null : state.activeRoundIndex,
        }
      }
      return {
        ...state,
        timeRemaining: nextTime,
      }
    }
    case 'reset':
      return {
        ...initialState,
        rounds: state.rounds.length ? state.rounds : defaultRounds,
      }
    default:
      return state
  }
}

interface DebateFlowContextValue {
  state: DebateState
  beginTopicSelection: () => void
  selectTopic: (topic: string) => void
  setParticipants: (participants: string[]) => void
  setRoundDuration: (duration: number) => void
  startDebate: () => void
  advanceRound: () => void
  tick: (delta?: number) => void
  resetDebate: () => void
}

const DebateFlowContext = createContext<DebateFlowContextValue | undefined>(undefined)

export const DebateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const beginTopicSelection = useCallback(() => dispatch({ type: 'beginTopicSelection' }), [])
  const selectTopic = useCallback((topic: string) => dispatch({ type: 'selectTopic', topic }), [])
  const setParticipants = useCallback(
    (participants: string[]) => dispatch({ type: 'setParticipants', participants }),
    [],
  )
  const setRoundDuration = useCallback(
    (duration: number) => dispatch({ type: 'setRoundDuration', duration }),
    [],
  )
  const startDebate = useCallback(() => dispatch({ type: 'startDebate' }), [])
  const advanceRound = useCallback(() => dispatch({ type: 'advanceRound' }), [])
  const tick = useCallback((delta?: number) => dispatch({ type: 'tick', delta }), [])
  const resetDebate = useCallback(() => dispatch({ type: 'reset' }), [])

  const value = useMemo(
    () => ({
      state,
      beginTopicSelection,
      selectTopic,
      setParticipants,
      setRoundDuration,
      startDebate,
      advanceRound,
      tick,
      resetDebate,
    }),
    [
      state,
      beginTopicSelection,
      selectTopic,
      setParticipants,
      setRoundDuration,
      startDebate,
      advanceRound,
      tick,
      resetDebate,
    ],
  )

  return createElement(DebateFlowContext.Provider, { value }, children)
}

export const useDebateFlow = () => {
  const context = useContext(DebateFlowContext)
  if (!context) {
    throw new Error('useDebateFlow must be used within a DebateProvider')
  }
  return context
}
