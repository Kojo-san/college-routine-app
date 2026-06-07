/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Exercise` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ExerciseType" ADD VALUE 'ABS';

-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "createdAt",
ADD COLUMN     "exerciseDbId" TEXT;
