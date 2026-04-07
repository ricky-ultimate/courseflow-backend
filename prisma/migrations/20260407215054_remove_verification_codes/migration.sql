/*
  Warnings:

  - You are about to drop the `verification_codes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "verification_codes" DROP CONSTRAINT "verification_codes_createdBy_fkey";

-- DropTable
DROP TABLE "verification_codes";
