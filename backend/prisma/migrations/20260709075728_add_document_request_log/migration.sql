-- CreateTable
CREATE TABLE "DocumentRequestLog" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSent" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "DocumentRequestLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentRequestLog" ADD CONSTRAINT "DocumentRequestLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequestLog" ADD CONSTRAINT "DocumentRequestLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
