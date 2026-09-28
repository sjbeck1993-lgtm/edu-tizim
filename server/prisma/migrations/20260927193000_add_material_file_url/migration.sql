-- Add fileUrl column for course materials. Documents/presentations are
-- stored as a base64 data URI (same pattern as User.avatarUrl and
-- Payment.receiptUrl); video materials store an external link instead,
-- since raw video files are far too large for Render's ephemeral disk
-- or a Postgres row.
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
