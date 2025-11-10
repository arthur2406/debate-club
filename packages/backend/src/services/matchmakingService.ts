import { v4 as uuid } from "uuid";
import {
  MatchmakingPreference,
  MatchmakingRequest,
} from "@debate-club/shared";
import { InMemoryMatchmakingRepository } from "../repositories/matchmakingRepository";

export class MatchmakingService {
  constructor(private readonly repository: InMemoryMatchmakingRepository) {}

  async enqueue(userId: string, preference: MatchmakingPreference): Promise<MatchmakingRequest> {
    const ticket: MatchmakingRequest = {
      id: uuid(),
      userId,
      submittedAt: new Date().toISOString(),
      preference,
    };
    await this.repository.enqueue(ticket);
    return ticket;
  }

  async dequeue(userId: string): Promise<void> {
    await this.repository.dequeue(userId);
  }

  async listQueue(): Promise<MatchmakingRequest[]> {
    return this.repository.listQueue();
  }
}
