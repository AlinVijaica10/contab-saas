/*
  Warnings:

  - A unique constraint covering the columns `[clientId,recurringMonth,recurringYear]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "recurringMonth" INTEGER,
ADD COLUMN     "recurringYear" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_clientId_recurringMonth_recurringYear_key" ON "Invoice"("clientId", "recurringMonth", "recurringYear");
