import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovimientoDto {
  @ApiProperty({ example: '2026-09-04' })
  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty({ enum: ['ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA', 'PRODUCCION', 'MORTALIDAD', 'VENTA', 'DESPACHO', 'ENTRADA_LOTE', 'TRASLADO'] })
  @IsEnum(['ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA', 'PRODUCCION', 'MORTALIDAD', 'VENTA', 'DESPACHO', 'ENTRADA_LOTE', 'TRASLADO'] as const)
  @IsNotEmpty()
  tipoMovimiento: string;

  @ApiProperty({ enum: ['GALLINA', 'HUEVO', 'ALIMENTO', 'BANDEJA'] })
  @IsEnum(['GALLINA', 'HUEVO', 'ALIMENTO', 'BANDEJA'] as const)
  @IsNotEmpty()
  tipoProducto: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productoRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  galponId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoHuevoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  origen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destino?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tipoBandeja?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacion?: string;
}
