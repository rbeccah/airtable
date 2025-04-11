-- CreateTable
CREATE TABLE "_ViewToRow" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ViewToRow_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ViewToRow_B_index" ON "_ViewToRow"("B");

-- AddForeignKey
ALTER TABLE "_ViewToRow" ADD CONSTRAINT "_ViewToRow_A_fkey" FOREIGN KEY ("A") REFERENCES "Row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ViewToRow" ADD CONSTRAINT "_ViewToRow_B_fkey" FOREIGN KEY ("B") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;
