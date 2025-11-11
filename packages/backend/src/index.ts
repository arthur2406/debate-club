import Fastify from "fastify";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import type WebSocket from "ws";
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
import { DebateTopic, WhipIceCandidate } from "@debate-club/shared";

const DEFAULT_TOPICS: Array<Pick<DebateTopic, "title" | "description" | "tags">> = [
  {
    title: "Technology & Society",
    description: "Should AI assistants be regulated as public utilities?",
    tags: ["technology", "policy"],
  },
  {
    title: "Climate Policy",
    description: "Is a carbon tax the most effective tool to reduce emissions?",
    tags: ["environment"],
  },
  {
    title: "Education Reform",
    description: "Should universities eliminate standardized testing requirements?",
    tags: ["education"],
  },
  {
    title: "Media Literacy",
    description: "Are social media platforms responsible for fact-checking content?",
    tags: ["media"],
  },
];

async function seedTopics(topicService: TopicService) {
  const existing = await topicService.listTopics();
  if (existing.length > 0) {
    return;
  }
  await Promise.all(
    DEFAULT_TOPICS.map((topic) =>
      topicService.createTopic({
        title: topic.title,
        description: topic.description,
        tags: topic.tags,
      })
    )
  );
}

async function buildServer() {
  const fastify = Fastify({ logger: true });
  await fastify.register(websocket);
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const topicRepository = new InMemoryTopicRepository();
  const matchmakingRepository = new InMemoryMatchmakingRepository();
  const sessionRepository = new InMemorySessionRepository();
  const feedbackRepository = new InMemoryFeedbackRepository();

  const topicService = new TopicService(topicRepository);
  const matchmakingService = new MatchmakingService(matchmakingRepository);
  const sessionService = new SessionService(sessionRepository);
  const feedbackService = new FeedbackService(feedbackRepository);
  const participantsPerSession = Number(process.env.PARTICIPANTS_PER_SESSION ?? 2);
  const whipGateway = new WhipGateway({ sessionService, participantsPerSession });
  await seedTopics(topicService);

  const signalingSockets = new Map<string, Map<string, WebSocket>>();

  await fastify.register(topicRoutes, { topicService });
  await fastify.register(matchmakingRoutes, { matchmakingService });
  await fastify.register(sessionRoutes, { sessionService, topicService });
  await fastify.register(feedbackRoutes, { feedbackService });

  fastify.get("/sessions/:sessionId/participants", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const participants = whipGateway.listParticipants(sessionId);
    if (!participants.length) {
      reply.code(200);
    }
    return participants;
  });

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
      const { participantId } = request.query as { participantId?: string };

      if (!participantId) {
        connection.socket.close(1008, "participantId required");
        return;
      }

      const sessionSockets = signalingSockets.get(sessionId) ?? new Map<string, WebSocket>();
      signalingSockets.set(sessionId, sessionSockets);
      sessionSockets.set(participantId, connection.socket);

      const sendJSON = (socket: WebSocket, payload: unknown) => {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify(payload));
        }
      };

      const forwardToParticipant = (targetId: string, payload: unknown) => {
        const targetSocket = sessionSockets.get(targetId);
        if (!targetSocket) {
          return;
        }
        sendJSON(targetSocket, payload);
      };

      const handlePhaseChanged = (payload: {
        sessionId: string;
        phase: string;
        round: number;
      }) => {
        if (payload.sessionId === sessionId) {
          sendJSON(connection.socket, {
            type: "phase",
            phase: payload.phase,
            round: payload.round,
          });
        }
      };

      const handleParticipantEvent = (type: string) => (payload: any) => {
        if (payload.sessionId === sessionId) {
          sendJSON(connection.socket, { type, payload });
        }
      };

      const joinedListener = handleParticipantEvent("participant-joined");
      const leftListener = handleParticipantEvent("participant-left");
      const iceListener = (payload: {
        sessionId: string;
        participantId: string;
        candidate: WhipIceCandidate;
      }) => {
        if (payload.sessionId === sessionId) {
          sendJSON(connection.socket, { type: "ice", payload });
        }
      };

      whipGateway.on("phase-changed", handlePhaseChanged);
      whipGateway.on("participant-joined", joinedListener);
      whipGateway.on("participant-left", leftListener);
      whipGateway.on("ice-candidate", iceListener);

      connection.socket.on("message", async (rawMessage: Buffer) => {
        try {
          const parsed = JSON.parse(rawMessage.toString());
          if (parsed.type === "heartbeat") {
            await whipGateway.handleSessionHeartbeat(sessionId, participantId);
            return;
          }

          if (parsed.type === "offer" || parsed.type === "answer") {
            if (typeof parsed.to === "string") {
              forwardToParticipant(parsed.to, {
                type: parsed.type,
                from: participantId,
                description: parsed.description,
              });
            }
            return;
          }

          if (parsed.type === "ice") {
            if (parsed.to) {
              forwardToParticipant(parsed.to, {
                type: "ice",
                from: participantId,
                candidate: parsed.candidate,
              });
            }
            if (parsed.candidate) {
              await whipGateway.handleIceCandidate(sessionId, participantId, parsed.candidate);
            }
            return;
          }
        } catch (error) {
          request.log.warn({ err: error }, "Invalid signaling payload");
        }
      });

      const handleClose = async () => {
        whipGateway.off("phase-changed", handlePhaseChanged);
        whipGateway.off("participant-joined", joinedListener);
        whipGateway.off("participant-left", leftListener);
        whipGateway.off("ice-candidate", iceListener);

        sessionSockets.delete(participantId);
        if (sessionSockets.size === 0) {
          signalingSockets.delete(sessionId);
        }

        await whipGateway.handleDelete(sessionId, participantId);
      };

      connection.socket.on("close", handleClose);
      connection.socket.on("error", handleClose);
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
