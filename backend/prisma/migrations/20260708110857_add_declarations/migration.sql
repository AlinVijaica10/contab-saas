-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('SRL', 'PFA');

-- CreateEnum
CREATE TYPE "FiscalRegime" AS ENUM ('MICRO', 'PROFIT', 'REAL', 'NORMA_VENIT');

-- CreateEnum
CREATE TYPE "VatPeriodicity" AS ENUM ('MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "DeclarationType" AS ENUM ('D100', 'D101', 'BILANT', 'D300', 'D390', 'D394', 'D112', 'D212', 'D205');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "clientType" "ClientType" NOT NULL DEFAULT 'SRL',
ADD COLUMN     "fiscalRegime" "FiscalRegime" NOT NULL DEFAULT 'MICRO',
ADD COLUMN     "hasEmployees" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVatPayer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatPeriodicity" "VatPeriodicity";

-- CreateTable
CREATE TABLE "DeclarationSubmission" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "declarationType" "DeclarationType" NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "DeclarationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeclarationSubmission_clientId_declarationType_month_year_key" ON "DeclarationSubmission"("clientId", "declarationType", "month", "year");

-- AddForeignKey
ALTER TABLE "DeclarationSubmission" ADD CONSTRAINT "DeclarationSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationSubmission" ADD CONSTRAINT "DeclarationSubmission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
