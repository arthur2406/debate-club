import {
  FeedbackRepository,
  FeedbackSubmission,
} from "@debate-club/shared";

/**
 * PostgreSQL feedback repository contract with an in-memory list.
 */
export class InMemoryFeedbackRepository implements FeedbackRepository {
  private feedback: FeedbackSubmission[] = [];

  async submitFeedback(feedback: FeedbackSubmission): Promise<void> {
    this.feedback.push(feedback);
  }

  async getFeedbackForSession(sessionId: string): Promise<FeedbackSubmission[]> {
    return this.feedback.filter((entry) => entry.sessionId === sessionId);
  }
}
