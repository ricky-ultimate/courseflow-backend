-- AlterEnum
ALTER TYPE "College" ADD VALUE 'CAHS';

-- AlterTable
ALTER TABLE "courses" ALTER COLUMN "semester" SET DEFAULT 'SECOND';

-- AlterTable
ALTER TABLE "schedules" ALTER COLUMN "semester" SET DEFAULT 'SECOND';
