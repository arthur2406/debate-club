import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { SessionService } from "../services/sessionService";
import { TopicService } from "../services/topicService";

interface SessionRoutesOptions extends FastifyPluginOptions {
  sessionService: SessionService;
  topicService: TopicService;
}

export async function sessionRoutes(
  fastify: FastifyInstance,
  options: SessionRoutesOptions
) {
  const { sessionService, topicService } = options;

  fastify.get("/sessions", async () => {
    return sessionService.listSessions();
  });

  fastify.get<{ Params: { id: string } }>("/sessions/:id", async (request, reply) => {
    const session = await sessionService.getSession(request.params.id);
    if (!session) {
      reply.code(404);
      return { message: "Session not found" };
    }
    return session;
  });

  fastify.post<{ Body: { topicId: string; participantIds: string[] } }>(
    "/sessions",
    async (request, reply) => {
      const topics = await topicService.listTopics();
      const topic = topics.find((item) => item.id === request.body.topicId);
      if (!topic) {
        reply.code(400);
        return { message: "Topic not found" };
      }
      const session = await sessionService.createSession({
        topic,
        participantIds: request.body.participantIds,
      });
      reply.code(201);
      return session;
    }
  );

  fastify.post<{
    Params: { id: string };
    Body: { phase: string; round: number; durationMs?: number };
  }>("/sessions/:id/phase", async (request, reply) => {
    const { id } = request.params;
    const { phase, round, durationMs } = request.body;
    const startedAt = new Date().toISOString();
    const session = await sessionService.updatePhase(id, phase as any, round, {
      durationMs: durationMs ?? 0,
      startedAt,
      endsAt: durationMs ? new Date(Date.now() + durationMs).toISOString() : undefined,
    });
    if (!session) {
      reply.code(404);
      return { message: "Session not found" };
    }
    return session;
  });
}
