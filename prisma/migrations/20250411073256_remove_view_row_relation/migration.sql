/*
  Warnings:

  - You are about to drop the `_ViewToRow` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ViewToRow" DROP CONSTRAINT "_ViewToRow_A_fkey";

-- DropForeignKey
ALTER TABLE "_ViewToRow" DROP CONSTRAINT "_ViewToRow_B_fkey";

-- DropTable
DROP TABLE "_ViewToRow";
