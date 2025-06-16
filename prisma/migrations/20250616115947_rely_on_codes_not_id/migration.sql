/*
  Warnings:

  - You are about to drop the column `departmentId` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `schedules` table. All the data in the column will be lost.
  - Added the required column `departmentCode` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseCode` to the `schedules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_courseId_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "departmentId",
ADD COLUMN     "departmentCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "courseId",
ADD COLUMN     "courseCode" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_departmentCode_fkey" FOREIGN KEY ("departmentCode") REFERENCES "departments"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_courseCode_fkey" FOREIGN KEY ("courseCode") REFERENCES "courses"("code") ON DELETE CASCADE ON UPDATE CASCADE;
