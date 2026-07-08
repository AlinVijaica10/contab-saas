-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('INVOICE', 'BANK_STATEMENT', 'CONTRACT', 'OTHER');

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientUploadLink" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientUploadLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientUploadLink_clientId_key" ON "ClientUploadLink"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientUploadLink_token_key" ON "ClientUploadLink"("token");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientUploadLink" ADD CONSTRAINT "ClientUploadLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientUploadLink" ADD CONSTRAINT "ClientUploadLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
