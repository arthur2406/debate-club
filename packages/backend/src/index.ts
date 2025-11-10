import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { topicRoutes } from "./routes/topicRoutes";
import { matchmakingRoutes } from "./routes/matchmakingRoutes";
import { sessionRoutes } from "./routes/sessionRoutes";
import { feedbackRoutes } from "./routes/feedbackRoutes";
import { InMemoryTopicRepository } from "./repositories/topicRepository";
import { InMemoryMatchmakingRepository } from "./repositories/matchmakingRepository";
import { InMemorySessionRepository } from "./repositories/sessionRepository";
import { InMemoryFeedbackRepository } from "./repositories/feedbackRepository";
import { TopicService } from "./services/topicService";
import { MatchmakingService } from "./services/matchmakingService";
import { SessionService } from "./services/sessionService";
import { FeedbackService } from "./services/feedbackService";
import { WhipGateway } from "./signaling/whipGateway";
import { WhipIceCandidate } from "@debate-club/shared";

async function buildServer() {
  const fastify = Fastify({ logger: true });
  await fastify.register(websocket);

  const topicRepository = new InMemoryTopicRepository();
  const matchmakingRepository = new InMemoryMatchmakingRepository();
  const sessionRepository = new InMemorySessionRepository();
  const feedbackRepository = new InMemoryFeedbackRepository();

  const topicService = new TopicService(topicRepository);
  const matchmakingService = new MatchmakingService(matchmakingRepository);
  const sessionService = new SessionService(sessionRepository);
  const feedbackService = new FeedbackService(feedbackRepository);
  const whipGateway = new WhipGateway({ sessionService });

  await fastify.register(topicRoutes, { topicService });
  await fastify.register(matchmakingRoutes, { matchmakingService });
  await fastify.register(sessionRoutes, { sessionService, topicService });
  await fastify.register(feedbackRoutes, { feedbackService });

  fastify.post("/whip/publish", async (request, reply) => {
    const body = request.body as {
      sessionId: string;
      participantId: string;
      sdpOffer: string;
      clientCapabilities?: Record<string, unknown>;
    };
    try {
      const response = await whipGateway.handlePublish(body);
      return response;
    } catch (error) {
      request.log.error({ err: error }, "Failed to publish WHIP session");
      reply.code(400);
      return { message: (error as Error).message };
    }
  });

  fastify.post("/whip/:sessionId/:participantId/ice", async (request, reply) => {
    const { sessionId, participantId } = request.params as {
      sessionId: string;
      participantId: string;
    };
    const body = request.body as WhipIceCandidate;
    await whipGateway.handleIceCandidate(sessionId, participantId, body);
    reply.code(202);
    return { status: "accepted" };
  });

  fastify.delete("/whip/:sessionId/:participantId", async (request, reply) => {
    const { sessionId, participantId } = request.params as {
      sessionId: string;
      participantId: string;
    };
    await whipGateway.handleDelete(sessionId, participantId);
    reply.code(204);
  });

  fastify.get(
    "/sessions/:sessionId/signaling",
    { websocket: true },
    (connection, request) => {
      const { sessionId } = request.params as { sessionId: string };

      const handlePhaseChanged = (payload: {
        sessionId: string;
        phase: string;
        round: number;
      }) => {
        if (payload.sessionId === sessionId) {
          connection.socket.send(
            JSON.stringify({ type: "phase", phase: payload.phase, round: payload.round })
          );
        }
      };

      const handleParticipantEvent = (type: string) => (payload: any) => {
        if (payload.sessionId === sessionId) {
          connection.socket.send(JSON.stringify({ type, payload }));
        }
      };

      const handleClose = () => {
        whipGateway.off("phase-changed", handlePhaseChanged);
        whipGateway.off("participant-joined", joinedListener);
        whipGateway.off("participant-left", leftListener);
        whipGateway.off("ice-candidate", iceListener);
      };

      const joinedListener = handleParticipantEvent("participant-joined");
      const leftListener = handleParticipantEvent("participant-left");
      const iceListener = (payload: {
        sessionId: string;
        participantId: string;
        candidate: WhipIceCandidate;
      }) => {
        if (payload.sessionId === sessionId) {
          connection.socket.send(JSON.stringify({ type: "ice", payload }));
        }
      };

      whipGateway.on("phase-changed", handlePhaseChanged);
      whipGateway.on("participant-joined", joinedListener);
      whipGateway.on("participant-left", leftListener);
      whipGateway.on("ice-candidate", iceListener);

      connection.socket.on("message", async (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === "heartbeat") {
            await whipGateway.handleSessionHeartbeat(sessionId, parsed.participantId);
          } else if (parsed.type === "ice") {
            await whipGateway.handleIceCandidate(sessionId, parsed.participantId, parsed.candidate);
          }
        } catch (error) {
          request.log.warn({ err: error }, "Invalid signaling payload");
        }
      });

      connection.socket.on("close", handleClose);
    }
  );

  return fastify;
}

async function start() {
  const server = await buildServer();
  try {
    await server.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export type DebateClubServer = Awaited<ReturnType<typeof buildServer>>;
export { buildServer };
