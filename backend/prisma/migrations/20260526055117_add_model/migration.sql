-- CreateTable
CREATE TABLE "MenuView" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuView_restaurantId_idx" ON "MenuView"("restaurantId");

-- CreateIndex
CREATE INDEX "MenuView_viewedAt_idx" ON "MenuView"("viewedAt");

-- AddForeignKey
ALTER TABLE "MenuView" ADD CONSTRAINT "MenuView_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
