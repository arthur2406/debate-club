import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { FeedbackService } from "../services/feedbackService";

interface FeedbackRoutesOptions extends FastifyPluginOptions {
  feedbackService: FeedbackService;
}

export async function feedbackRoutes(
  fastify: FastifyInstance,
  options: FeedbackRoutesOptions
) {
  const { feedbackService } = options;

  fastify.post<{
    Params: { sessionId: string };
    Body: { fromUserId: string; toUserId: string; score: number; comment?: string };
  }>("/sessions/:sessionId/feedback", async (request, reply) => {
    const { sessionId } = request.params;
    const { fromUserId, toUserId, score, comment } = request.body;
    await feedbackService.submit({
      sessionId,
      fromUserId,
      toUserId,
      score,
      comment,
      submittedAt: new Date().toISOString(),
    });
    reply.code(202);
    return { status: "accepted" };
  });

  fastify.get<{ Params: { sessionId: string } }>(
    "/sessions/:sessionId/feedback",
    async (request) => {
      return feedbackService.getAggregate(request.params.sessionId);
    }
  );
}
