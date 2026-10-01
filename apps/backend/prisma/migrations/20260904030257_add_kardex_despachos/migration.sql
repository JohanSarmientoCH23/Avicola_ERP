-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA', 'PRODUCCION', 'MORTALIDAD', 'VENTA', 'DESPACHO', 'ENTRADA_LOTE', 'TRASLADO');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('GALLINA', 'HUEVO', 'ALIMENTO', 'BANDEJA');

-- AlterTable
ALTER TABLE "inventario_alimento" ADD COLUMN     "siloId" TEXT;

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipoMovimiento" "TipoMovimiento" NOT NULL,
    "tipoProducto" "TipoProducto" NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "productoRef" TEXT,
    "galponId" TEXT,
    "tipoHuevoId" TEXT,
    "origen" TEXT,
    "destino" TEXT,
    "referencia" TEXT,
    "usuarioId" TEXT NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despachos" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "cliente" TEXT NOT NULL,
    "guiaRemision" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "creadoPorId" TEXT NOT NULL,
    "aprobadoPorId" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despachos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despacho_detalles" (
    "id" TEXT NOT NULL,
    "despachoId" TEXT NOT NULL,
    "tipoHuevoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "precioUnit" DECIMAL(10,2),
    "pesoTotal" DECIMAL(10,2),
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "despacho_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "capacidad" DECIMAL(10,2) NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'KG',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "silos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimientos_inventario_fecha_idx" ON "movimientos_inventario"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipoProducto_idx" ON "movimientos_inventario"("tipoProducto");

-- CreateIndex
CREATE INDEX "movimientos_inventario_galponId_idx" ON "movimientos_inventario"("galponId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_usuarioId_idx" ON "movimientos_inventario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "silos_codigo_key" ON "silos"("codigo");

-- AddForeignKey
ALTER TABLE "inventario_alimento" ADD CONSTRAINT "inventario_alimento_siloId_fkey" FOREIGN KEY ("siloId") REFERENCES "silos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_tipoHuevoId_fkey" FOREIGN KEY ("tipoHuevoId") REFERENCES "tipos_huevo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despachos" ADD CONSTRAINT "despachos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despachos" ADD CONSTRAINT "despachos_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despacho_detalles" ADD CONSTRAINT "despacho_detalles_despachoId_fkey" FOREIGN KEY ("despachoId") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despacho_detalles" ADD CONSTRAINT "despacho_detalles_tipoHuevoId_fkey" FOREIGN KEY ("tipoHuevoId") REFERENCES "tipos_huevo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
