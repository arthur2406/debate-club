import { EventEmitter } from "events";
import {
  DebatePhase,
  DebateSessionState,
  WhipIceCandidate,
  WhipPublishRequest,
  WhipPublishResponse,
  WhipSession,
} from "@debate-club/shared";
import { SessionService } from "../services/sessionService";

interface WhipGatewayOptions {
  sessionService: SessionService;
  phaseDurationsMs?: Partial<Record<Exclude<DebatePhase, "lobby">, number>>;
  participantsPerSession?: number;
}

interface SessionTimers {
  timeout?: NodeJS.Timeout;
  currentPhaseIndex: number;
}

const DEFAULT_PHASE_SEQUENCE: Array<{ phase: DebatePhase; durationMs: number }> = [
  { phase: "opening", durationMs: 2 * 60 * 1000 },
  { phase: "rebuttal", durationMs: 2 * 60 * 1000 },
  { phase: "closing", durationMs: 60 * 1000 },
  { phase: "feedback", durationMs: 60 * 1000 },
];

export class WhipGateway extends EventEmitter {
  private readonly sessionParticipants = new Map<string, Map<string, WhipSession>>();
  private readonly sessionTimers = new Map<string, SessionTimers>();
  private readonly phaseSequence: Array<{ phase: DebatePhase; durationMs: number }>;
  private readonly participantsPerSession: number;

  constructor(private readonly options: WhipGatewayOptions) {
    super();
    const phaseOverrides = options.phaseDurationsMs ?? {};
    this.phaseSequence = DEFAULT_PHASE_SEQUENCE.map((phase) => ({
      phase: phase.phase,
      durationMs: phaseOverrides[phase.phase as keyof typeof phaseOverrides] ?? phase.durationMs,
    }));
    this.participantsPerSession = options.participantsPerSession ?? 2;
  }

  async handlePublish(request: WhipPublishRequest): Promise<WhipPublishResponse> {
    const session = await this.options.sessionService.getSession(request.sessionId);
    if (!session) {
      throw new Error(`Session ${request.sessionId} not found`);
    }

    const resourceURL = `/whip/sessions/${session.id}/participants/${request.participantId}`;
    const now = new Date().toISOString();
    const participant: WhipSession = {
      sessionId: session.id,
      participantId: request.participantId,
      resourceURL,
      createdAt: now,
      lastSeenAt: now,
      phase: session.currentPhase,
      round: session.currentRound,
    };

    const participants = this.getOrCreateParticipants(session.id);
    participants.set(request.participantId, participant);
    this.emit("participant-joined", participant);

    if (participants.size >= this.participantsPerSession) {
      await this.ensureSessionStarted(session.id, session);
    }

    return {
      resourceURL,
      sdpAnswer: request.sdpOffer,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  async handleSessionHeartbeat(sessionId: string, participantId: string): Promise<void> {
    const participants = this.sessionParticipants.get(sessionId);
    if (!participants) return;
    const participant = participants.get(participantId);
    if (!participant) return;
    participant.lastSeenAt = new Date().toISOString();
    this.emit("participant-heartbeat", participant);
  }

  async handleDelete(sessionId: string, participantId: string): Promise<void> {
    const participants = this.sessionParticipants.get(sessionId);
    if (!participants) return;
    participants.delete(participantId);
    this.emit("participant-left", { sessionId, participantId });
    if (participants.size === 0) {
      this.cancelSessionTimers(sessionId);
    }
  }

  async handleIceCandidate(
    sessionId: string,
    participantId: string,
    candidate: WhipIceCandidate
  ): Promise<void> {
    this.emit("ice-candidate", { sessionId, participantId, candidate });
  }

  private getOrCreateParticipants(sessionId: string) {
    if (!this.sessionParticipants.has(sessionId)) {
      this.sessionParticipants.set(sessionId, new Map());
    }
    return this.sessionParticipants.get(sessionId)!;
  }

  private async ensureSessionStarted(
    sessionId: string,
    sessionState: DebateSessionState
  ): Promise<void> {
    const timers = this.sessionTimers.get(sessionId);
    if (timers) {
      return;
    }

    const { sessionService } = this.options;
    const lobbyIndex = this.phaseSequence.findIndex((phase) => phase.phase === sessionState.currentPhase);
    const startingIndex = lobbyIndex >= 0 ? lobbyIndex : 0;

    const initialPhase = this.phaseSequence[startingIndex];
    await sessionService.updatePhase(sessionId, initialPhase.phase, 1, {
      durationMs: initialPhase.durationMs,
      startedAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + initialPhase.durationMs).toISOString(),
    });

    this.sessionTimers.set(sessionId, { currentPhaseIndex: startingIndex });
    this.scheduleNextPhase(sessionId, startingIndex + 1);
  }

  private scheduleNextPhase(sessionId: string, nextIndex: number) {
    const sessionTimer = this.sessionTimers.get(sessionId);
    if (!sessionTimer) return;

    if (nextIndex >= this.phaseSequence.length) {
      this.sessionTimers.set(sessionId, { ...sessionTimer, currentPhaseIndex: nextIndex });
      this.emit("session-complete", { sessionId });
      return;
    }

    const phase = this.phaseSequence[nextIndex];
    const delay = phase.durationMs;
    const timeout = setTimeout(async () => {
      await this.advancePhase(sessionId, nextIndex, phase);
    }, delay);

    this.sessionTimers.set(sessionId, {
      timeout,
      currentPhaseIndex: nextIndex,
    });
  }

  private async advancePhase(
    sessionId: string,
    phaseIndex: number,
    phase: { phase: DebatePhase; durationMs: number }
  ) {
    try {
      const { sessionService } = this.options;
      const updated = await sessionService.updatePhase(sessionId, phase.phase, phaseIndex + 1, {
        durationMs: phase.durationMs,
        startedAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + phase.durationMs).toISOString(),
      });
      if (updated) {
        this.emit("phase-changed", { sessionId, phase: phase.phase, round: updated.currentRound });
      }
      this.scheduleNextPhase(sessionId, phaseIndex + 1);
    } catch (error) {
      this.emit("phase-error", { sessionId, error });
    }
  }

  private cancelSessionTimers(sessionId: string) {
    const timers = this.sessionTimers.get(sessionId);
    if (!timers) return;
    if (timers.timeout) {
      clearTimeout(timers.timeout);
    }
    this.sessionTimers.delete(sessionId);
  }
}
