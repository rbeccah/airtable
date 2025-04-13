/*
  Warnings:

  - You are about to drop the column `direction` on the `SortCondition` table. All the data in the column will be lost.
  - Added the required column `order` to the `SortCondition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SortCondition" DROP COLUMN "direction",
ADD COLUMN     "order" TEXT NOT NULL;
