import { DebateSessionState, SessionRepository } from "@debate-club/shared";

/**
 * PostgreSQL session repository contract with an in-memory backing store.
 */
export class InMemorySessionRepository implements SessionRepository {
  private sessions: Map<string, DebateSessionState> = new Map();

  async saveSession(session: DebateSessionState): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async getSession(sessionId: string): Promise<DebateSessionState | undefined> {
    return this.sessions.get(sessionId);
  }

  async listSessions(): Promise<DebateSessionState[]> {
    return Array.from(this.sessions.values());
  }
}
