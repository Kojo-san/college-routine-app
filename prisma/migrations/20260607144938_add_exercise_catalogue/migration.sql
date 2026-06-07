-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('PUSH', 'PULL', 'LEGS', 'FULL_BODY', 'CARDIO', 'STRETCHING');

-- CreateEnum
CREATE TYPE "ExerciseLevel" AS ENUM ('DEBUTANT', 'INTERMEDIAIRE', 'AVANCE');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "level" "ExerciseLevel" NOT NULL,
    "equipment" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);
