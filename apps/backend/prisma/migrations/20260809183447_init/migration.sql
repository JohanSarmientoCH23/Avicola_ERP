-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'CONTADOR', 'RESPONSABLE_PRODUCCION', 'GALPONERO', 'AUDITOR', 'ALMACENISTA');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "EstadoGalpon" AS ENUM ('ACTIVO', 'INACTIVO', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('BORRADOR', 'PROCESADO', 'VALIDADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoComparacion" AS ENUM ('PENDIENTE', 'CORRECTO', 'CON_DIFERENCIAS', 'ERROR');

-- CreateEnum
CREATE TYPE "EstadoConciliacion" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "TipoHuevoCodigo" AS ENUM ('JUMBO', 'EXTRA', 'AA', 'A', 'B', 'REVOLTURA', 'C', 'PIPO', 'BLANCO', 'SUCIO', 'ROTO', 'YEMAS');

-- CreateEnum
CREATE TYPE "TipoBandeja" AS ENUM ('AA', 'A', 'B');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "avatar" TEXT,
    "telefono" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recuperaciones_contrasena" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recuperaciones_contrasena_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galpones" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "gallinasActuales" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoGalpon" NOT NULL DEFAULT 'ACTIVO',
    "loteId" TEXT,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galpones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_huevo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" "TipoHuevoCodigo" NOT NULL,
    "pesoMin" DECIMAL(5,2),
    "pesoMax" DECIMAL(5,2),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_huevo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_diarios" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "galponeroId" TEXT NOT NULL,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "imagenUrl" TEXT,
    "imagenMinioKey" TEXT,
    "textoOcr" TEXT,
    "datosOcr" JSONB,
    "fuente" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_diarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_galpon" (
    "id" TEXT NOT NULL,
    "reporteId" TEXT NOT NULL,
    "galponId" TEXT NOT NULL,
    "mortalidad" INTEGER NOT NULL DEFAULT 0,
    "produccion" INTEGER NOT NULL DEFAULT 0,
    "alimentoEntrada" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "alimentoConsumo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gallinas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detalles_galpon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producciones_huevo" (
    "id" TEXT NOT NULL,
    "reporteId" TEXT NOT NULL,
    "tipoHuevoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "salida" INTEGER NOT NULL DEFAULT 0,
    "saldo" INTEGER NOT NULL DEFAULT 0,
    "pesoTotal" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producciones_huevo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_excel" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "archivoUrl" TEXT,
    "archivoMinioKey" TEXT,
    "nombreArchivo" TEXT NOT NULL,
    "datosParseados" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'PROCESADO',
    "responsableId" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_excel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparaciones" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "reporteOcrId" TEXT,
    "reporteExcelId" TEXT NOT NULL,
    "estado" "EstadoComparacion" NOT NULL DEFAULT 'PENDIENTE',
    "totalCampos" INTEGER NOT NULL DEFAULT 0,
    "camposCorrectos" INTEGER NOT NULL DEFAULT 0,
    "camposConError" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_comparacion" (
    "id" TEXT NOT NULL,
    "comparacionId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorOcr" DECIMAL(15,2),
    "valorExcel" DECIMAL(15,2),
    "diferencia" DECIMAL(15,2),
    "porcentaje" DECIMAL(5,2),
    "estado" TEXT NOT NULL DEFAULT 'CORRECTO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalles_comparacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_comparacion_galpon" (
    "id" TEXT NOT NULL,
    "comparacionId" TEXT NOT NULL,
    "galponId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorOcr" DECIMAL(15,2),
    "valorExcel" DECIMAL(15,2),
    "diferencia" DECIMAL(15,2),
    "estado" TEXT NOT NULL DEFAULT 'CORRECTO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalles_comparacion_galpon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliaciones" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" "EstadoConciliacion" NOT NULL DEFAULT 'PENDIENTE',
    "aprobadoPorId" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conciliaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_conciliacion" (
    "id" TEXT NOT NULL,
    "conciliacionId" TEXT NOT NULL,
    "comparacionId" TEXT,
    "concepto" TEXT NOT NULL,
    "valorImagen" DECIMAL(15,2),
    "valorExcel" DECIMAL(15,2),
    "valorSistema" DECIMAL(15,2),
    "diferencia" DECIMAL(15,2),
    "estado" TEXT NOT NULL DEFAULT 'CORRECTO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalles_conciliacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_gallinas" (
    "id" TEXT NOT NULL,
    "galponId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "saldoInicial" INTEGER NOT NULL DEFAULT 0,
    "entradas" INTEGER NOT NULL DEFAULT 0,
    "mortalidad" INTEGER NOT NULL DEFAULT 0,
    "ventas" INTEGER NOT NULL DEFAULT 0,
    "traslados" INTEGER NOT NULL DEFAULT 0,
    "saldoFinal" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_gallinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_huevos" (
    "id" TEXT NOT NULL,
    "tipoHuevoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "saldoInicial" INTEGER NOT NULL DEFAULT 0,
    "produccion" INTEGER NOT NULL DEFAULT 0,
    "ventas" INTEGER NOT NULL DEFAULT 0,
    "perdidas" INTEGER NOT NULL DEFAULT 0,
    "consumo" INTEGER NOT NULL DEFAULT 0,
    "saldoFinal" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_huevos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_alimento" (
    "id" TEXT NOT NULL,
    "galponId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "saldoInicialKg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "entradasKg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "consumoKg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldoFinalKg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldoInicialBultos" INTEGER NOT NULL DEFAULT 0,
    "entradasBultos" INTEGER NOT NULL DEFAULT 0,
    "consumoBultos" INTEGER NOT NULL DEFAULT 0,
    "saldoFinalBultos" INTEGER NOT NULL DEFAULT 0,
    "factorConversion" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_alimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_bandejas" (
    "id" TEXT NOT NULL,
    "galponId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoBandeja" NOT NULL,
    "entradas" INTEGER NOT NULL DEFAULT 0,
    "salidas" INTEGER NOT NULL DEFAULT 0,
    "saldoAnterior" INTEGER NOT NULL DEFAULT 0,
    "saldoBodega" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_bandejas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_bandejas_reporte" (
    "id" TEXT NOT NULL,
    "reporteId" TEXT NOT NULL,
    "tipo" "TipoBandeja" NOT NULL,
    "entradas" INTEGER NOT NULL DEFAULT 0,
    "salidas" INTEGER NOT NULL DEFAULT 0,
    "saldoAnterior" INTEGER NOT NULL DEFAULT 0,
    "saldoBodega" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_bandejas_reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "cambios" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "recuperaciones_contrasena_token_key" ON "recuperaciones_contrasena"("token");

-- CreateIndex
CREATE UNIQUE INDEX "galpones_codigo_key" ON "galpones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_huevo_codigo_key" ON "tipos_huevo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "reportes_diarios_fecha_galponeroId_key" ON "reportes_diarios"("fecha", "galponeroId");

-- CreateIndex
CREATE UNIQUE INDEX "detalles_galpon_reporteId_galponId_key" ON "detalles_galpon"("reporteId", "galponId");

-- CreateIndex
CREATE UNIQUE INDEX "producciones_huevo_reporteId_tipoHuevoId_key" ON "producciones_huevo"("reporteId", "tipoHuevoId");

-- CreateIndex
CREATE UNIQUE INDEX "conciliaciones_fecha_key" ON "conciliaciones"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_gallinas_galponId_fecha_key" ON "inventario_gallinas"("galponId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_huevos_tipoHuevoId_fecha_key" ON "inventario_huevos"("tipoHuevoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_alimento_galponId_fecha_key" ON "inventario_alimento"("galponId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_bandejas_galponId_fecha_tipo_key" ON "inventario_bandejas"("galponId", "fecha", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_bandejas_reporte_reporteId_tipo_key" ON "inventario_bandejas_reporte"("reporteId", "tipo");

-- CreateIndex
CREATE INDEX "auditorias_usuarioId_idx" ON "auditorias"("usuarioId");

-- CreateIndex
CREATE INDEX "auditorias_entidad_entidadId_idx" ON "auditorias"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "auditorias_createdAt_idx" ON "auditorias"("createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recuperaciones_contrasena" ADD CONSTRAINT "recuperaciones_contrasena_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galpones" ADD CONSTRAINT "galpones_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_diarios" ADD CONSTRAINT "reportes_diarios_galponeroId_fkey" FOREIGN KEY ("galponeroId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_galpon" ADD CONSTRAINT "detalles_galpon_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "reportes_diarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_galpon" ADD CONSTRAINT "detalles_galpon_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producciones_huevo" ADD CONSTRAINT "producciones_huevo_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "reportes_diarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producciones_huevo" ADD CONSTRAINT "producciones_huevo_tipoHuevoId_fkey" FOREIGN KEY ("tipoHuevoId") REFERENCES "tipos_huevo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_excel" ADD CONSTRAINT "reportes_excel_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparaciones" ADD CONSTRAINT "comparaciones_reporteOcrId_fkey" FOREIGN KEY ("reporteOcrId") REFERENCES "reportes_diarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparaciones" ADD CONSTRAINT "comparaciones_reporteExcelId_fkey" FOREIGN KEY ("reporteExcelId") REFERENCES "reportes_excel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparaciones" ADD CONSTRAINT "comparaciones_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_comparacion" ADD CONSTRAINT "detalles_comparacion_comparacionId_fkey" FOREIGN KEY ("comparacionId") REFERENCES "comparaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_comparacion_galpon" ADD CONSTRAINT "detalles_comparacion_galpon_comparacionId_fkey" FOREIGN KEY ("comparacionId") REFERENCES "comparaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_comparacion_galpon" ADD CONSTRAINT "detalles_comparacion_galpon_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliaciones" ADD CONSTRAINT "conciliaciones_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_conciliacion" ADD CONSTRAINT "detalles_conciliacion_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "conciliaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_conciliacion" ADD CONSTRAINT "detalles_conciliacion_comparacionId_fkey" FOREIGN KEY ("comparacionId") REFERENCES "comparaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_gallinas" ADD CONSTRAINT "inventario_gallinas_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_huevos" ADD CONSTRAINT "inventario_huevos_tipoHuevoId_fkey" FOREIGN KEY ("tipoHuevoId") REFERENCES "tipos_huevo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_alimento" ADD CONSTRAINT "inventario_alimento_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_bandejas" ADD CONSTRAINT "inventario_bandejas_galponId_fkey" FOREIGN KEY ("galponId") REFERENCES "galpones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_bandejas_reporte" ADD CONSTRAINT "inventario_bandejas_reporte_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "reportes_diarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
