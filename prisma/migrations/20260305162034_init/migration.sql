-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "airaloOrderId" INTEGER,
    "airaloOrderCode" TEXT,
    "packageId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "iccid" TEXT,
    "qrcode" TEXT,
    "qrcodeUrl" TEXT,
    "price" REAL,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "installationGuides" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
