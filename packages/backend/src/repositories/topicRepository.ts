import { DebateTopic, TopicRepository } from "@debate-club/shared";

/**
 * PostgreSQL-backed repository contract for debate topics.
 * The in-memory implementation provided here is a placeholder until the
 * database connection pool is wired via Prisma/TypeORM or a similar adapter.
 */
export class InMemoryTopicRepository implements TopicRepository {
  private topics: Map<string, DebateTopic> = new Map();

  constructor(seed: DebateTopic[] = []) {
    seed.forEach((topic) => this.topics.set(topic.id, topic));
  }

  async listTopics(): Promise<DebateTopic[]> {
    return Array.from(this.topics.values()).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  }

  async createTopic(topic: DebateTopic): Promise<void> {
    this.topics.set(topic.id, topic);
  }
}
