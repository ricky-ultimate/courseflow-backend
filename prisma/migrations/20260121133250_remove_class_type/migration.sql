/*
  Warnings:

  - You are about to drop the column `type` on the `schedules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "type";

-- DropEnum
DROP TYPE "ClassType";
