-- Initial schema for debate club application

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');

CREATE TYPE "DebateStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- Helper function to automatically set updatedAt on row change
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    "displayName" TEXT NOT NULL,
    role "UserRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Topic" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Debate" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "topicId" UUID NOT NULL REFERENCES "Topic"(id) ON DELETE CASCADE,
    "affirmativeUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    "negativeUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    "scheduledAt" TIMESTAMPTZ NOT NULL,
    status "DebateStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Feedback" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "debateId" UUID NOT NULL REFERENCES "Debate"(id) ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL DEFAULT 0,
    comment TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Feedback_debateId_idx" ON "Feedback"("debateId");
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

CREATE TRIGGER set_timestamp_user
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_topic
BEFORE UPDATE ON "Topic"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_debate
BEFORE UPDATE ON "Debate"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
