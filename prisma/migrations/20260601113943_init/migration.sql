-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('calm', 'focused', 'anxious', 'excited', 'tired');

-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "content" VARCHAR(240) NOT NULL,
    "mood" "Mood" NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "date_key" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signals_clerk_user_id_idx" ON "signals"("clerk_user_id");

-- CreateIndex
CREATE INDEX "signals_is_public_created_at_idx" ON "signals"("is_public", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "signals_clerk_user_id_date_key_key" ON "signals"("clerk_user_id", "date_key");
