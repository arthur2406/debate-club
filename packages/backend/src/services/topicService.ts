import { v4 as uuid } from "uuid";
import { DebateTopic } from "@debate-club/shared";
import { InMemoryTopicRepository } from "../repositories/topicRepository";

export class TopicService {
  constructor(private readonly repository: InMemoryTopicRepository) {}

  async listTopics(): Promise<DebateTopic[]> {
    return this.repository.listTopics();
  }

  async createTopic(input: Omit<DebateTopic, "id" | "createdAt" | "updatedAt">): Promise<DebateTopic> {
    const now = new Date().toISOString();
    const topic: DebateTopic = {
      id: uuid(),
      title: input.title,
      description: input.description,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.createTopic(topic);
    return topic;
  }
}
