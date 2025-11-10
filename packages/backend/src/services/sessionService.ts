import { v4 as uuid } from "uuid";
import {
  DebatePhase,
  DebateSessionState,
  DebateTopic,
  DebateRoundTiming,
} from "@debate-club/shared";
import { InMemorySessionRepository } from "../repositories/sessionRepository";

interface CreateSessionOptions {
  topic: DebateTopic;
  participantIds: string[];
  initialPhase?: DebatePhase;
}

export class SessionService {
  constructor(private readonly repository: InMemorySessionRepository) {}

  async createSession(options: CreateSessionOptions): Promise<DebateSessionState> {
    const now = new Date().toISOString();
    const session: DebateSessionState = {
      id: uuid(),
      topicId: options.topic.id,
      topic: options.topic,
      participantIds: options.participantIds,
      createdAt: now,
      status: "pending",
      currentPhase: options.initialPhase ?? "lobby",
      currentRound: 0,
      roundTiming: null,
    };
    await this.repository.saveSession(session);
    return session;
  }

  async updatePhase(
    sessionId: string,
    phase: DebatePhase,
    round: number,
    timing?: Omit<DebateRoundTiming, "phase" | "round">
  ): Promise<DebateSessionState | undefined> {
    const session = await this.repository.getSession(sessionId);
    if (!session) {
      return undefined;
    }
    const roundTiming: DebateRoundTiming | null = timing
      ? {
          round,
          phase,
          durationMs: timing.durationMs,
          startedAt: timing.startedAt,
          endsAt: timing.endsAt,
        }
      : null;
    const next: DebateSessionState = {
      ...session,
      status: phase === "feedback" ? "completed" : "active",
      currentPhase: phase,
      currentRound: round,
      roundTiming,
    };
    await this.repository.saveSession(next);
    return next;
  }

  async getSession(sessionId: string): Promise<DebateSessionState | undefined> {
    return this.repository.getSession(sessionId);
  }

  async listSessions(): Promise<DebateSessionState[]> {
    return this.repository.listSessions();
  }
}
