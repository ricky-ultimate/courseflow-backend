-- CreateTable
CREATE TABLE "course_aliases" (
    "id" TEXT NOT NULL,
    "primaryCode" TEXT NOT NULL,
    "aliasCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_aliases_primaryCode_aliasCode_key" ON "course_aliases"("primaryCode", "aliasCode");

-- AddForeignKey
ALTER TABLE "course_aliases" ADD CONSTRAINT "course_aliases_primaryCode_fkey" FOREIGN KEY ("primaryCode") REFERENCES "courses"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_aliases" ADD CONSTRAINT "course_aliases_aliasCode_fkey" FOREIGN KEY ("aliasCode") REFERENCES "courses"("code") ON DELETE CASCADE ON UPDATE CASCADE;
