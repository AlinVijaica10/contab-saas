-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "monthlyFee" DECIMAL(12,2),
ADD COLUMN     "monthlyFeeDescription" TEXT DEFAULT 'Servicii de contabilitate',
ADD COLUMN     "monthlyFeeVatRate" DECIMAL(5,2) DEFAULT 19;
