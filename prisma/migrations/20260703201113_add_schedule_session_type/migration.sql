/*
  Warnings:

  - A unique constraint covering the columns `[courseCode,sessionId,sessionType]` on the table `schedules` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('THEORY', 'PRACTICAL');

-- DropIndex
DROP INDEX "schedules_courseCode_sessionId_key";

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "sessionType" "SessionType" NOT NULL DEFAULT 'THEORY';

-- CreateIndex
CREATE UNIQUE INDEX "schedules_courseCode_sessionId_sessionType_key" ON "schedules"("courseCode", "sessionId", "sessionType");
