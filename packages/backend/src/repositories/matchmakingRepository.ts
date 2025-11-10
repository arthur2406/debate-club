import {
  MatchmakingRepository,
  MatchmakingRequest,
} from "@debate-club/shared";

/**
 * Intended PostgreSQL-backed matchmaking queue repository.
 * Uses an in-memory FIFO queue until the SQL schema is introduced.
 */
export class InMemoryMatchmakingRepository implements MatchmakingRepository {
  private queue: Map<string, MatchmakingRequest> = new Map();

  async enqueue(request: MatchmakingRequest): Promise<void> {
    this.queue.set(request.userId, request);
  }

  async dequeue(userId: string): Promise<void> {
    this.queue.delete(userId);
  }

  async listQueue(): Promise<MatchmakingRequest[]> {
    return Array.from(this.queue.values()).sort((a, b) =>
      a.submittedAt.localeCompare(b.submittedAt)
    );
  }
}
