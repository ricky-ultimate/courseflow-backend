/*
  Warnings:

  - You are about to drop the column `venue` on the `exam_schedules` table. All the data in the column will be lost.
  - Added the required column `studentCount` to the `exam_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venueId` to the `exam_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "College" AS ENUM ('CBAS', 'CHMS');

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "college" "College" NOT NULL DEFAULT 'CBAS';

-- AlterTable
ALTER TABLE "exam_schedules" DROP COLUMN "venue",
ADD COLUMN     "studentCount" INTEGER NOT NULL,
ADD COLUMN     "targetCollege" "College",
ADD COLUMN     "venueId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isIct" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_name_key" ON "venues"("name");

-- AddForeignKey
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
