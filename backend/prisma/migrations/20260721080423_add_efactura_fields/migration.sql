-- CreateEnum
CREATE TYPE "InvoiceDocumentType" AS ENUM ('NORMAL', 'STORNO');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressCountry" TEXT NOT NULL DEFAULT 'RO',
ADD COLUMN     "addressCounty" TEXT,
ADD COLUMN     "addressPostalCode" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "iban" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "documentType" "InvoiceDocumentType" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "unitOfMeasure" TEXT NOT NULL DEFAULT 'H87',
ADD COLUMN     "vatExemptionReason" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressCountry" TEXT NOT NULL DEFAULT 'RO',
ADD COLUMN     "addressCounty" TEXT,
ADD COLUMN     "addressPostalCode" TEXT,
ADD COLUMN     "addressStreet" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "iban" TEXT;
