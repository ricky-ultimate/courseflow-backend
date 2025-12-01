-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "lecturerId" TEXT;

-- CreateTable
CREATE TABLE "lecturers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "departmentCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_email_key" ON "lecturers"("email");

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_departmentCode_fkey" FOREIGN KEY ("departmentCode") REFERENCES "departments"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
