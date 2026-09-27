-- Add avatarUrl column for profile pictures (students, teachers, admin).
-- Stored as a base64 data URI directly in the DB rather than on local
-- disk, since Render's filesystem is ephemeral and would lose uploaded
-- files on every deploy.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
