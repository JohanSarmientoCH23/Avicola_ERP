-- CreateEnum
CREATE TYPE "TipoCosto" AS ENUM ('DIRECTO', 'INDIRECTO');

-- CreateEnum
CREATE TYPE "EstadoCosto" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "categorias_costo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoCosto" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_costo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costos_directos" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "EstadoCosto" NOT NULL DEFAULT 'PENDIENTE',
    "comprobanteUrl" TEXT,
    "observaciones" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "galponId" TEXT,
    "aprobadoPorId" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "costos_directos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos_fijos" (
    "id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "recurrencia" TEXT NOT NULL DEFAULT 'MENSUAL',
    "diaVencimiento" INTEGER,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_fijos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_costo_nombre_key" ON "categorias_costo"("nombre");

-- AddForeignKey
ALTER TABLE "costos_directos" ADD CONSTRAINT "costos_directos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_costo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_directos" ADD CONSTRAINT "costos_directos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_directos" ADD CONSTRAINT "costos_directos_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
