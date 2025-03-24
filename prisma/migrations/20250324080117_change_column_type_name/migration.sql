/*
  Warnings:

  - The values [TEXT,NUMBER] on the enum `ColumnType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ColumnType_new" AS ENUM ('Text', 'Number');
ALTER TABLE "Column" ALTER COLUMN "type" TYPE "ColumnType_new" USING ("type"::text::"ColumnType_new");
ALTER TYPE "ColumnType" RENAME TO "ColumnType_old";
ALTER TYPE "ColumnType_new" RENAME TO "ColumnType";
DROP TYPE "ColumnType_old";
COMMIT;
