-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "invoiceDefaultNote" TEXT,
ADD COLUMN     "invoiceDefaultVatRate" DECIMAL(5,2) DEFAULT 19,
ADD COLUMN     "invoiceDueDays" INTEGER DEFAULT 30,
ADD COLUMN     "invoiceSeriesPrefix" TEXT DEFAULT 'FCT';
