/*
  Warnings:

  - You are about to drop the column `venueId` on the `exam_schedules` table. All the data in the column will be lost.
  - You are about to drop the `venues` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `venue` to the `exam_schedules` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `venue` on the `schedules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('UNIVERSITY_ICT_CENTER', 'ICT_LAB_1', 'ICT_LAB_2', 'LECTURE_HALL_1', 'LECTURE_HALL_2', 'LECTURE_HALL_3', 'AUDITORIUM_A', 'AUDITORIUM_B', 'SEMINAR_ROOM_A', 'SEMINAR_ROOM_B', 'ROOM_101', 'ROOM_102', 'ROOM_201', 'ROOM_202', 'ROOM_301', 'ROOM_302', 'COMPUTER_LAB', 'SCIENCE_LAB_1', 'SCIENCE_LAB_2');

-- DropForeignKey
ALTER TABLE "exam_schedules" DROP CONSTRAINT "exam_schedules_venueId_fkey";

-- AlterTable
ALTER TABLE "exam_schedules" DROP COLUMN "venueId",
ADD COLUMN     "venue" "VenueType" NOT NULL;

-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "venue",
ADD COLUMN     "venue" "VenueType" NOT NULL;

-- DropTable
DROP TABLE "venues";
