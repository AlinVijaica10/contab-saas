-- CreateEnum
CREATE TYPE "AnafStatus" AS ENUM ('PENDING', 'PROCESSING', 'OK', 'ERROR');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "anafErrorMessage" TEXT,
ADD COLUMN     "anafSentAt" TIMESTAMP(3),
ADD COLUMN     "anafStatus" "AnafStatus",
ADD COLUMN     "anafUploadIndex" TEXT;

-- CreateTable
CREATE TABLE "AnafCredential" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnafCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnafCredential_tenantId_key" ON "AnafCredential"("tenantId");

-- AddForeignKey
ALTER TABLE "AnafCredential" ADD CONSTRAINT "AnafCredential_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
