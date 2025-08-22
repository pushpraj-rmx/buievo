-- CreateTable
CREATE TABLE "configurations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "configurations_organizationId_idx" ON "configurations"("organizationId");
