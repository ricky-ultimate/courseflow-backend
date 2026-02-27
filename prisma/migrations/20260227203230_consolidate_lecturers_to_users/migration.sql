/*
  Warnings:

  - You are about to drop the `lecturers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_lecturerId_fkey";

-- DropForeignKey
ALTER TABLE "lecturers" DROP CONSTRAINT "lecturers_departmentCode_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "departmentCode" TEXT,
ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "lecturers";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentCode_fkey" FOREIGN KEY ("departmentCode") REFERENCES "departments"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
