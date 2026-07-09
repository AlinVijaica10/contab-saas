-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('CLIENT_UPLOAD', 'INTERNAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentCategory" ADD VALUE 'CI_ADMINISTRATOR';
ALTER TYPE "DocumentCategory" ADD VALUE 'ACTE_INFIINTARE';
ALTER TYPE "DocumentCategory" ADD VALUE 'DECLARATII';
ALTER TYPE "DocumentCategory" ADD VALUE 'ADEVERINTE';
ALTER TYPE "DocumentCategory" ADD VALUE 'PONTAJE';
ALTER TYPE "DocumentCategory" ADD VALUE 'STATE_SALARII';
ALTER TYPE "DocumentCategory" ADD VALUE 'BILANT';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "source" "DocumentSource" NOT NULL DEFAULT 'CLIENT_UPLOAD';
