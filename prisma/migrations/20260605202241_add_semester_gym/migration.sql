-- CreateTable
CREATE TABLE "SemesterSetup" (
    "id" TEXT NOT NULL,
    "wakeTime" TEXT NOT NULL,
    "sleepTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SemesterSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePersonalHours" (
    "id" TEXT NOT NULL,
    "personalHoursPerWeek" DOUBLE PRECISION NOT NULL,
    "semesterSetupId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CoursePersonalHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymPreferences" (
    "id" TEXT NOT NULL,
    "frequencyPerWeek" INTEGER NOT NULL DEFAULT 3,
    "sessionDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "preferredDays" INTEGER[],
    "preferredTime" TEXT NOT NULL DEFAULT 'matin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GymPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SemesterSetup_userId_key" ON "SemesterSetup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePersonalHours_semesterSetupId_courseId_key" ON "CoursePersonalHours"("semesterSetupId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "GymPreferences_userId_key" ON "GymPreferences"("userId");

-- AddForeignKey
ALTER TABLE "SemesterSetup" ADD CONSTRAINT "SemesterSetup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePersonalHours" ADD CONSTRAINT "CoursePersonalHours_semesterSetupId_fkey" FOREIGN KEY ("semesterSetupId") REFERENCES "SemesterSetup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePersonalHours" ADD CONSTRAINT "CoursePersonalHours_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymPreferences" ADD CONSTRAINT "GymPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
