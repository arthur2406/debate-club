import {
  FeedbackAggregate,
  FeedbackSubmission,
} from "@debate-club/shared";
import { InMemoryFeedbackRepository } from "../repositories/feedbackRepository";

export class FeedbackService {
  constructor(private readonly repository: InMemoryFeedbackRepository) {}

  async submit(feedback: FeedbackSubmission): Promise<void> {
    await this.repository.submitFeedback(feedback);
  }

  async getAggregate(sessionId: string): Promise<FeedbackAggregate> {
    const submissions = await this.repository.getFeedbackForSession(sessionId);
    const aggregates = new Map<string, { total: number; count: number }>();

    for (const entry of submissions) {
      const existing = aggregates.get(entry.toUserId) ?? { total: 0, count: 0 };
      existing.total += entry.score;
      existing.count += 1;
      aggregates.set(entry.toUserId, existing);
    }

    return {
      sessionId,
      scores: Array.from(aggregates.entries()).map(([userId, { total, count }]) => ({
        userId,
        averageScore: count ? total / count : 0,
        submissions: count,
      })),
    };
  }
}
