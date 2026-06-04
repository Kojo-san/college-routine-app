-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CognitiveIntensity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'DEEP_WORK');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('STUDY', 'FITNESS', 'RECOVERY', 'SLEEP', 'PLANNING', 'STRESS');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('ACADEMIC', 'FITNESS');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('STUDY', 'FITNESS', 'RECOVERY');

-- CreateEnum
CREATE TYPE "StudyStrategyType" AS ENUM ('ACTIVE_RECALL', 'SPACED_REPETITION', 'PRACTICE_TESTING', 'MIND_MAP', 'POMODORO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningPreferences" (
    "id" TEXT NOT NULL,
    "preferredWakeTime" TEXT NOT NULL,
    "preferredSleepTime" TEXT NOT NULL,
    "preferredGymTime" TEXT,
    "maxDailyStudyHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PlanningPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetGpa" DOUBLE PRECISION,
    "targetGrade" TEXT,
    "targetWeight" DOUBLE PRECISION,
    "targetBodyFat" DOUBLE PRECISION,
    "targetStrength" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 3,
    "estimatedWeeklyWorkload" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePlan" (
    "id" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "topics" TEXT[],
    "evaluationRules" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CoursePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "cognitiveIntensity" "CognitiveIntensity",
    "expectedOutcome" TEXT,
    "strategy" "StudyStrategyType",
    "workoutType" TEXT,
    "muscleGroups" TEXT[],
    "fitnessIntensity" INTEGER,
    "recoveryType" TEXT,
    "courseId" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthData" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "HealthData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepData" (
    "id" TEXT NOT NULL,
    "sleepDurationHours" DOUBLE PRECISION NOT NULL,
    "sleepEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "deepSleepMinutes" INTEGER NOT NULL DEFAULT 0,
    "healthDataId" TEXT NOT NULL,

    CONSTRAINT "SleepData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityData" (
    "id" TEXT NOT NULL,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "activeCalories" INTEGER NOT NULL DEFAULT 0,
    "workoutMinutes" INTEGER NOT NULL DEFAULT 0,
    "healthDataId" TEXT NOT NULL,

    CONSTRAINT "ActivityData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeartRateData" (
    "id" TEXT NOT NULL,
    "restingHeartRate" INTEGER NOT NULL,
    "averageHeartRate" INTEGER NOT NULL,
    "healthDataId" TEXT NOT NULL,

    CONSTRAINT "HeartRateData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryScore" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "physicalFatigue" INTEGER NOT NULL,
    "cognitiveFatigue" INTEGER NOT NULL,
    "sleepDebt" DOUBLE PRECISION NOT NULL,
    "healthDataId" TEXT NOT NULL,

    CONSTRAINT "RecoveryScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveState" (
    "id" TEXT NOT NULL,
    "focusLevel" INTEGER NOT NULL,
    "mentalFatigue" INTEGER NOT NULL,
    "stressLevel" INTEGER NOT NULL,
    "motivationLevel" INTEGER NOT NULL,
    "healthDataId" TEXT NOT NULL,

    CONSTRAINT "CognitiveState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlan" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "scoreJournee" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "typeActivite" TEXT,
    "dailyPlanId" TEXT NOT NULL,
    "sessionId" TEXT,
    "taskId" TEXT,

    CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "message" TEXT NOT NULL,
    "explanation" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyPlanId" TEXT NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScientificRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "recommendationTemplate" TEXT NOT NULL,
    "evidenceSourceId" TEXT NOT NULL,

    CONSTRAINT "ScientificRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" TEXT,

    CONSTRAINT "EvidenceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RecommendationRules" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RecommendationRules_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningPreferences_userId_key" ON "PlanningPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePlan_courseId_key" ON "CoursePlan"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthData_userId_date_key" ON "HealthData"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SleepData_healthDataId_key" ON "SleepData"("healthDataId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityData_healthDataId_key" ON "ActivityData"("healthDataId");

-- CreateIndex
CREATE UNIQUE INDEX "HeartRateData_healthDataId_key" ON "HeartRateData"("healthDataId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryScore_healthDataId_key" ON "RecoveryScore"("healthDataId");

-- CreateIndex
CREATE UNIQUE INDEX "CognitiveState_healthDataId_key" ON "CognitiveState"("healthDataId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlan_userId_date_key" ON "DailyPlan"("userId", "date");

-- CreateIndex
CREATE INDEX "_RecommendationRules_B_index" ON "_RecommendationRules"("B");

-- AddForeignKey
ALTER TABLE "PlanningPreferences" ADD CONSTRAINT "PlanningPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePlan" ADD CONSTRAINT "CoursePlan_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthData" ADD CONSTRAINT "HealthData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepData" ADD CONSTRAINT "SleepData_healthDataId_fkey" FOREIGN KEY ("healthDataId") REFERENCES "HealthData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityData" ADD CONSTRAINT "ActivityData_healthDataId_fkey" FOREIGN KEY ("healthDataId") REFERENCES "HealthData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeartRateData" ADD CONSTRAINT "HeartRateData_healthDataId_fkey" FOREIGN KEY ("healthDataId") REFERENCES "HealthData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryScore" ADD CONSTRAINT "RecoveryScore_healthDataId_fkey" FOREIGN KEY ("healthDataId") REFERENCES "HealthData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CognitiveState" ADD CONSTRAINT "CognitiveState_healthDataId_fkey" FOREIGN KEY ("healthDataId") REFERENCES "HealthData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScientificRule" ADD CONSTRAINT "ScientificRule_evidenceSourceId_fkey" FOREIGN KEY ("evidenceSourceId") REFERENCES "EvidenceSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecommendationRules" ADD CONSTRAINT "_RecommendationRules_A_fkey" FOREIGN KEY ("A") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecommendationRules" ADD CONSTRAINT "_RecommendationRules_B_fkey" FOREIGN KEY ("B") REFERENCES "ScientificRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
