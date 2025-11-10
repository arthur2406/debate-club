import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { TopicService } from "../services/topicService";

interface TopicRoutesOptions extends FastifyPluginOptions {
  topicService: TopicService;
}

export async function topicRoutes(
  fastify: FastifyInstance,
  options: TopicRoutesOptions
) {
  const { topicService } = options;

  fastify.get("/topics", async () => {
    return topicService.listTopics();
  });

  fastify.post<{ Body: { title: string; description?: string; tags?: string[] } }>(
    "/topics",
    async (request, reply) => {
      const topic = await topicService.createTopic(request.body);
      reply.code(201);
      return topic;
    }
  );
}
