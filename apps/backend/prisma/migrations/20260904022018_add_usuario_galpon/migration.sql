-- AlterEnum
ALTER TYPE "EstadoConciliacion" ADD VALUE 'CORRECCION_SOLICITADA';

-- CreateTable
CREATE TABLE "usuario_galpon" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "galponId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_galpon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_galpon_usuarioId_galponId_key" ON "usuario_galpon"("usuarioId", "galponId");

-- AddForeignKey
ALTER TABLE "usuario_galpon" ADD CONSTRAINT "usuario_galpon_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_galpon" ADD CONSTRAINT "usuario_galpon_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
