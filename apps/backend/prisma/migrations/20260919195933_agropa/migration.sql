/*
  Warnings:

  - You are about to drop the column `categoriaId` on the `costos_directos` table. All the data in the column will be lost.
  - You are about to drop the column `cliente` on the `despachos` table. All the data in the column will be lost.
  - You are about to drop the column `direccion` on the `despachos` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `despachos` table. All the data in the column will be lost.
  - You are about to drop the column `concepto` on the `detalles_conciliacion` table. All the data in the column will be lost.
  - You are about to drop the column `concepto` on the `gastos_fijos` table. All the data in the column will be lost.
  - You are about to drop the column `consumoBultos` on the `inventario_alimento` table. All the data in the column will be lost.
  - You are about to drop the column `entradasBultos` on the `inventario_alimento` table. All the data in the column will be lost.
  - You are about to drop the column `factorConversion` on the `inventario_alimento` table. All the data in the column will be lost.
  - You are about to drop the column `saldoFinalBultos` on the `inventario_alimento` table. All the data in the column will be lost.
  - You are about to drop the column `saldoInicialBultos` on the `inventario_alimento` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `rol_permisos` table. All the data in the column will be lost.
  - You are about to drop the `movimientos_inventario` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `conceptoId` to the `costos_directos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `despachos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conceptoId` to the `detalles_conciliacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conceptoId` to the `gastos_fijos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "costos_directos" DROP CONSTRAINT "costos_directos_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_galponId_fkey";

-- DropForeignKey
ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_tipoHuevoId_fkey";

-- DropForeignKey
ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "rol_permisos" DROP CONSTRAINT "rol_permisos_usuarioId_fkey";

-- AlterTable
ALTER TABLE "costos_directos" DROP COLUMN "categoriaId",
ADD COLUMN     "conceptoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "despachos" DROP COLUMN "cliente",
DROP COLUMN "direccion",
DROP COLUMN "telefono",
ADD COLUMN     "clienteId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "detalles_conciliacion" DROP COLUMN "concepto",
ADD COLUMN     "conceptoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "gastos_fijos" DROP COLUMN "concepto",
ADD COLUMN     "conceptoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inventario_alimento" DROP COLUMN "consumoBultos",
DROP COLUMN "entradasBultos",
DROP COLUMN "factorConversion",
DROP COLUMN "saldoFinalBultos",
DROP COLUMN "saldoInicialBultos";

-- AlterTable
ALTER TABLE "rol_permisos" DROP COLUMN "usuarioId";

-- DropTable
DROP TABLE "movimientos_inventario";

-- DropEnum
DROP TYPE "TipoMovimiento";

-- DropEnum
DROP TYPE "TipoProducto";

-- CreateTable
CREATE TABLE "permisos_usuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "permisoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "ruc" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conceptos_costo" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidadMedida" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conceptos_costo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conceptos_gasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conceptos_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conceptos_conciliacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "modulo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conceptos_conciliacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_gallina" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipoMovimiento" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "galponId" TEXT NOT NULL,
    "origen" TEXT,
    "destino" TEXT,
    "referencia" TEXT,
    "usuarioId" TEXT NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_gallina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_huevo" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipoMovimiento" TEXT NOT NULL,
    "tipoHuevoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "origen" TEXT,
    "destino" TEXT,
    "referencia" TEXT,
    "usuarioId" TEXT NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_huevo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_alimento" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipoMovimiento" TEXT NOT NULL,
    "cantidadKg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "galponId" TEXT,
    "siloId" TEXT,
    "origen" TEXT,
    "destino" TEXT,
    "referencia" TEXT,
    "usuarioId" TEXT NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_alimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_bandeja" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipoMovimiento" TEXT NOT NULL,
    "tipo" "TipoBandeja" NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "galponId" TEXT,
    "origen" TEXT,
    "destino" TEXT,
    "referencia" TEXT,
    "usuarioId" TEXT NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_bandeja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permisos_usuario_usuarioId_idx" ON "permisos_usuario"("usuarioId");

-- CreateIndex
CREATE INDEX "permisos_usuario_permisoId_idx" ON "permisos_usuario"("permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_usuario_usuarioId_permisoId_key" ON "permisos_usuario"("usuarioId", "permisoId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_ruc_key" ON "clientes"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "conceptos_costo_categoriaId_nombre_key" ON "conceptos_costo"("categoriaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "conceptos_gasto_nombre_key" ON "conceptos_gasto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "conceptos_conciliacion_nombre_key" ON "conceptos_conciliacion"("nombre");

-- CreateIndex
CREATE INDEX "movimientos_gallina_fecha_idx" ON "movimientos_gallina"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_gallina_galponId_idx" ON "movimientos_gallina"("galponId");

-- CreateIndex
CREATE INDEX "movimientos_gallina_usuarioId_idx" ON "movimientos_gallina"("usuarioId");

-- CreateIndex
CREATE INDEX "movimientos_huevo_fecha_idx" ON "movimientos_huevo"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_huevo_tipoHuevoId_idx" ON "movimientos_huevo"("tipoHuevoId");

-- CreateIndex
CREATE INDEX "movimientos_huevo_usuarioId_idx" ON "movimientos_huevo"("usuarioId");

-- CreateIndex
CREATE INDEX "movimientos_alimento_fecha_idx" ON "movimientos_alimento"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_alimento_galponId_idx" ON "movimientos_alimento"("galponId");

-- CreateIndex
CREATE INDEX "movimientos_alimento_siloId_idx" ON "movimientos_alimento"("siloId");

-- CreateIndex
CREATE INDEX "movimientos_alimento_usuarioId_idx" ON "movimientos_alimento"("usuarioId");

-- CreateIndex
CREATE INDEX "movimientos_bandeja_fecha_idx" ON "movimientos_bandeja"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_bandeja_galponId_idx" ON "movimientos_bandeja"("galponId");

-- CreateIndex
CREATE INDEX "movimientos_bandeja_usuarioId_idx" ON "movimientos_bandeja"("usuarioId");

-- CreateIndex
CREATE INDEX "costos_directos_conceptoId_idx" ON "costos_directos"("conceptoId");

-- CreateIndex
CREATE INDEX "despachos_clienteId_idx" ON "despachos"("clienteId");

-- CreateIndex
CREATE INDEX "gastos_fijos_conceptoId_idx" ON "gastos_fijos"("conceptoId");

-- AddForeignKey
ALTER TABLE "permisos_usuario" ADD CONSTRAINT "permisos_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos_usuario" ADD CONSTRAINT "permisos_usuario_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conceptos_costo" ADD CONSTRAINT "conceptos_costo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_costo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_conciliacion" ADD CONSTRAINT "detalles_conciliacion_conceptoId_fkey" FOREIGN KEY ("conceptoId") REFERENCES "conceptos_conciliacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_gallina" ADD CONSTRAINT "movimientos_gallina_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_gallina" ADD CONSTRAINT "movimientos_gallina_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_huevo" ADD CONSTRAINT "movimientos_huevo_tipoHuevoId_fkey" FOREIGN KEY ("tipoHuevoId") REFERENCES "tipos_huevo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_huevo" ADD CONSTRAINT "movimientos_huevo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_alimento" ADD CONSTRAINT "movimientos_alimento_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_alimento" ADD CONSTRAINT "movimientos_alimento_siloId_fkey" FOREIGN KEY ("siloId") REFERENCES "silos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_alimento" ADD CONSTRAINT "movimientos_alimento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_bandeja" ADD CONSTRAINT "movimientos_bandeja_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_bandeja" ADD CONSTRAINT "movimientos_bandeja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_directos" ADD CONSTRAINT "costos_directos_conceptoId_fkey" FOREIGN KEY ("conceptoId") REFERENCES "conceptos_costo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_fijos" ADD CONSTRAINT "gastos_fijos_conceptoId_fkey" FOREIGN KEY ("conceptoId") REFERENCES "conceptos_gasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despachos" ADD CONSTRAINT "despachos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
