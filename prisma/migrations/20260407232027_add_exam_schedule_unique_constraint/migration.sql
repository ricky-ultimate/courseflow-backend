/*
  Warnings:

  - A unique constraint covering the columns `[courseCode,sessionId]` on the table `exam_schedules` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "exam_schedules_courseCode_sessionId_key" ON "exam_schedules"("courseCode", "sessionId");
