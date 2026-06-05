-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('COURS', 'LAB');

-- CreateTable
CREATE TABLE "CourseSchedule" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CourseSchedule" ADD CONSTRAINT "CourseSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
