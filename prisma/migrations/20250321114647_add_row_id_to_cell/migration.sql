/*
  Warnings:

  - The required column `rowId` was added to the `Cell` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Cell" ADD COLUMN     "rowId" TEXT NOT NULL;
