-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'COLLEGE_ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "collegeCode" "College";
