import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { MatchmakingService } from "../services/matchmakingService";

interface MatchmakingRoutesOptions extends FastifyPluginOptions {
  matchmakingService: MatchmakingService;
}

export async function matchmakingRoutes(
  fastify: FastifyInstance,
  options: MatchmakingRoutesOptions
) {
  const { matchmakingService } = options;

  fastify.get("/queue", async () => {
    return matchmakingService.listQueue();
  });

  fastify.post<{ Body: { userId: string; preference?: Record<string, any> } }>(
    "/queue",
    async (request, reply) => {
      const { userId, preference = {} } = request.body;
      const ticket = await matchmakingService.enqueue(userId, preference);
      reply.code(202);
      return ticket;
    }
  );

  fastify.delete<{ Params: { userId: string } }>(
    "/queue/:userId",
    async (request, reply) => {
      await matchmakingService.dequeue(request.params.userId);
      reply.code(204);
    }
  );
}
