/*
  Warnings:

  - You are about to drop the column `aprobadoEn` on the `costos_directos` table. All the data in the column will be lost.
  - You are about to drop the column `aprobadoPorId` on the `costos_directos` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `costos_directos` table. All the data in the column will be lost.
  - You are about to drop the column `aprobadoEn` on the `despachos` table. All the data in the column will be lost.
  - You are about to drop the column `aprobadoPorId` on the `despachos` table. All the data in the column will be lost.
  - You are about to drop the column `datosOcr` on the `reportes_diarios` table. All the data in the column will be lost.
  - You are about to drop the column `imagenMinioKey` on the `reportes_diarios` table. All the data in the column will be lost.
  - You are about to drop the column `imagenUrl` on the `reportes_diarios` table. All the data in the column will be lost.
  - You are about to drop the column `textoOcr` on the `reportes_diarios` table. All the data in the column will be lost.
  - The `fuente` column on the `reportes_diarios` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EstadoAprobacion" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "FuenteReporte" AS ENUM ('MANUAL', 'OCR', 'EXCEL');

-- DropForeignKey
ALTER TABLE "despachos" DROP CONSTRAINT "despachos_aprobadoPorId_fkey";

-- AlterTable
ALTER TABLE "costos_directos" DROP COLUMN "aprobadoEn",
DROP COLUMN "aprobadoPorId",
DROP COLUMN "estado";

-- AlterTable
ALTER TABLE "despachos" DROP COLUMN "aprobadoEn",
DROP COLUMN "aprobadoPorId";

-- AlterTable
ALTER TABLE "reportes_diarios" DROP COLUMN "datosOcr",
DROP COLUMN "imagenMinioKey",
DROP COLUMN "imagenUrl",
DROP COLUMN "textoOcr",
DROP COLUMN "fuente",
ADD COLUMN     "fuente" "FuenteReporte" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "permisos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "id" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "permisoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_ocr_data" (
    "id" TEXT NOT NULL,
    "reporteId" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "imagenMinioKey" TEXT,
    "textoOcr" TEXT,
    "datosOcr" JSONB,
    "confianza" DECIMAL(5,2),
    "procesadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_ocr_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costos_aprobaciones" (
    "id" TEXT NOT NULL,
    "costoId" TEXT NOT NULL,
    "estado" "EstadoCosto" NOT NULL DEFAULT 'PENDIENTE',
    "aprobadoPorId" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "costos_aprobaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despachos_aprobaciones" (
    "id" TEXT NOT NULL,
    "despachoId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "aprobadoPorId" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despachos_aprobaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE INDEX "permisos_modulo_idx" ON "permisos"("modulo");

-- CreateIndex
CREATE INDEX "rol_permisos_rol_idx" ON "rol_permisos"("rol");

-- CreateIndex
CREATE INDEX "rol_permisos_permisoId_idx" ON "rol_permisos"("permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "rol_permisos_rol_permisoId_key" ON "rol_permisos"("rol", "permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "reportes_ocr_data_reporteId_key" ON "reportes_ocr_data"("reporteId");

-- CreateIndex
CREATE UNIQUE INDEX "costos_aprobaciones_costoId_key" ON "costos_aprobaciones"("costoId");

-- CreateIndex
CREATE INDEX "costos_aprobaciones_estado_idx" ON "costos_aprobaciones"("estado");

-- CreateIndex
CREATE INDEX "costos_aprobaciones_aprobadoPorId_idx" ON "costos_aprobaciones"("aprobadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "despachos_aprobaciones_despachoId_key" ON "despachos_aprobaciones"("despachoId");

-- CreateIndex
CREATE INDEX "despachos_aprobaciones_estado_idx" ON "despachos_aprobaciones"("estado");

-- CreateIndex
CREATE INDEX "despachos_aprobaciones_aprobadoPorId_idx" ON "despachos_aprobaciones"("aprobadoPorId");

-- CreateIndex
CREATE INDEX "comparaciones_fecha_idx" ON "comparaciones"("fecha");

-- CreateIndex
CREATE INDEX "comparaciones_estado_idx" ON "comparaciones"("estado");

-- CreateIndex
CREATE INDEX "comparaciones_creadoPorId_idx" ON "comparaciones"("creadoPorId");

-- CreateIndex
CREATE INDEX "costos_directos_fecha_idx" ON "costos_directos"("fecha");

-- CreateIndex
CREATE INDEX "costos_directos_galponId_idx" ON "costos_directos"("galponId");

-- CreateIndex
CREATE INDEX "costos_directos_creadoPorId_idx" ON "costos_directos"("creadoPorId");

-- CreateIndex
CREATE INDEX "despachos_fecha_idx" ON "despachos"("fecha");

-- CreateIndex
CREATE INDEX "despachos_estado_idx" ON "despachos"("estado");

-- CreateIndex
CREATE INDEX "despachos_creadoPorId_idx" ON "despachos"("creadoPorId");

-- CreateIndex
CREATE INDEX "detalles_galpon_galponId_idx" ON "detalles_galpon"("galponId");

-- CreateIndex
CREATE INDEX "producciones_huevo_tipoHuevoId_idx" ON "producciones_huevo"("tipoHuevoId");

-- CreateIndex
CREATE INDEX "recuperaciones_contrasena_usuarioId_idx" ON "recuperaciones_contrasena"("usuarioId");

-- CreateIndex
CREATE INDEX "recuperaciones_contrasena_expiresAt_idx" ON "recuperaciones_contrasena"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuarioId_idx" ON "refresh_tokens"("usuarioId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "reportes_diarios_fecha_idx" ON "reportes_diarios"("fecha");

-- CreateIndex
CREATE INDEX "reportes_diarios_estado_idx" ON "reportes_diarios"("estado");

-- CreateIndex
CREATE INDEX "reportes_diarios_fuente_idx" ON "reportes_diarios"("fuente");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_estado_idx" ON "usuarios"("estado");

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_ocr_data" ADD CONSTRAINT "reportes_ocr_data_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "reportes_diarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_aprobaciones" ADD CONSTRAINT "costos_aprobaciones_costoId_fkey" FOREIGN KEY ("costoId") REFERENCES "costos_directos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_aprobaciones" ADD CONSTRAINT "costos_aprobaciones_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despachos_aprobaciones" ADD CONSTRAINT "despachos_aprobaciones_despachoId_fkey" FOREIGN KEY ("despachoId") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despachos_aprobaciones" ADD CONSTRAINT "despachos_aprobaciones_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
