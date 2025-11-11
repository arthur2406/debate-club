export type DebatePhase = "lobby" | "opening" | "rebuttal" | "closing" | "feedback";

export interface DebateTopic {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchmakingPreference {
  preferredTopicIds?: string[];
  skillLevel?: "beginner" | "intermediate" | "advanced";
  language?: string;
}

export interface MatchmakingRequest {
  id: string;
  userId: string;
  submittedAt: string;
  preference: MatchmakingPreference;
}

export interface MatchmakingTicket extends MatchmakingRequest {
  expiresAt?: string;
}

export interface DebateRoundTiming {
  round: number;
  phase: DebatePhase;
  durationMs: number;
  startedAt?: string;
  endsAt?: string;
}

export interface DebateSessionState {
  id: string;
  topicId: string;
  topic: DebateTopic;
  participantIds: string[];
  createdAt: string;
  status: "pending" | "active" | "completed" | "abandoned";
  currentPhase: DebatePhase;
  currentRound: number;
  roundTiming: DebateRoundTiming | null;
}

export interface FeedbackSubmission {
  sessionId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment?: string;
  submittedAt: string;
}

export interface FeedbackAggregate {
  sessionId: string;
  scores: Array<{ userId: string; averageScore: number; submissions: number }>;
}

export interface WhipPublishRequest {
  sessionId: string;
  participantId: string;
  sdpOffer: string;
  clientCapabilities?: Record<string, unknown>;
}

export interface WhipPublishResponse {
  resourceURL: string;
  sdpAnswer: string;
  expiresAt: string;
}

export interface WhipIceCandidate {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export interface WhipSession {
  sessionId: string;
  participantId: string;
  resourceURL: string;
  createdAt: string;
  lastSeenAt: string;
  phase: DebatePhase;
  round: number;
  metadata?: Record<string, unknown>;
}

export interface TopicRepository {
  listTopics(): Promise<DebateTopic[]>;
  createTopic(topic: DebateTopic): Promise<void>;
}

export interface MatchmakingRepository {
  enqueue(request: MatchmakingRequest): Promise<void>;
  dequeue(userId: string): Promise<void>;
  listQueue(): Promise<MatchmakingRequest[]>;
}

export interface SessionRepository {
  saveSession(session: DebateSessionState): Promise<void>;
  getSession(sessionId: string): Promise<DebateSessionState | undefined>;
  listSessions(): Promise<DebateSessionState[]>;
}

export interface FeedbackRepository {
  submitFeedback(feedback: FeedbackSubmission): Promise<void>;
  getFeedbackForSession(sessionId: string): Promise<FeedbackSubmission[]>;
}
