-- Real question/answer storage for homework tasks. Previously "grading"
-- just assigned a random score with no actual question or answer data
-- anywhere in the schema.
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Question" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentAnswer" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answerText" TEXT,
    "isCorrect" BOOLEAN,
    "aiScore" INTEGER,
    "aiFeedback" TEXT,

    CONSTRAINT "StudentAnswer_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "Question" ADD CONSTRAINT "Question_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
