-- Create users table for local profile sync from Clerk webhooks
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Unique Clerk identity per local user
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- Add updated_at to signals for edit tracking
ALTER TABLE "signals"
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill users for existing signals so FK can be added safely
INSERT INTO "users" ("id", "clerk_id", "created_at", "updated_at")
SELECT
    ('seed_' || "clerk_user_id")::text,
    "clerk_user_id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "signals"
GROUP BY "clerk_user_id"
ON CONFLICT ("clerk_id") DO NOTHING;

-- Enforce data consistency between signals and users
ALTER TABLE "signals"
ADD CONSTRAINT "signals_clerk_user_id_fkey"
FOREIGN KEY ("clerk_user_id") REFERENCES "users"("clerk_id")
ON DELETE CASCADE
ON UPDATE CASCADE;
