/*
  Warnings:

  - You are about to drop the column `columnVisibility` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `sort` on the `View` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "View" DROP COLUMN "columnVisibility",
DROP COLUMN "filters",
DROP COLUMN "sort";

-- CreateTable
CREATE TABLE "FilterCondition" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "column" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilterCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SortCondition" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "column" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SortCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColumnVisibility" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColumnVisibility_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FilterCondition" ADD CONSTRAINT "FilterCondition_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SortCondition" ADD CONSTRAINT "SortCondition_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnVisibility" ADD CONSTRAINT "ColumnVisibility_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
