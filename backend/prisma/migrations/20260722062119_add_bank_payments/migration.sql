/*
  Warnings:

  - A unique constraint covering the columns `[bankNotificationEmail]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BankPaymentStatus" AS ENUM ('UNMATCHED', 'MATCHED', 'IGNORED');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "bankNotificationEmail" TEXT;

-- CreateTable
CREATE TABLE "BankPayment" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "invoiceId" INTEGER,
    "bankName" TEXT NOT NULL DEFAULT 'UniCredit',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "payerName" TEXT,
    "referenceText" TEXT,
    "rawEmailBody" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BankPaymentStatus" NOT NULL DEFAULT 'UNMATCHED',

    CONSTRAINT "BankPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_bankNotificationEmail_key" ON "Tenant"("bankNotificationEmail");

-- AddForeignKey
ALTER TABLE "BankPayment" ADD CONSTRAINT "BankPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankPayment" ADD CONSTRAINT "BankPayment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankPayment" ADD CONSTRAINT "BankPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
