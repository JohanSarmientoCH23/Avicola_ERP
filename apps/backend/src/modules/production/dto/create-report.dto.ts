import { IsString, IsDateString, IsArray, ValidateNested, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DetalleGalponDto {
  @ApiProperty()
  @IsString()
  galponId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mortalidad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  produccion?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  alimentoEntrada?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  alimentoConsumo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gallinas?: number;
}

export class ProduccionHuevoDto {
  @ApiProperty()
  @IsString()
  tipoHuevoId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salida?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  saldo?: number;
}

export class InventarioBandejaDto {
  @ApiProperty({ enum: ['AA', 'A', 'B'] })
  @IsEnum(['AA', 'A', 'B'] as const)
  tipo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  entradas?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salidas?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  saldoAnterior?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  saldoBodega?: number;
}

export class CreateReportDto {
  @ApiProperty({ example: '2026-08-05' })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fuente?: string;

  @ApiPropertyOptional()
  @IsOptional()
  datosOcr?: any;

  @ApiProperty({ type: [DetalleGalponDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleGalponDto)
  detallesGalpon: DetalleGalponDto[];

  @ApiProperty({ type: [ProduccionHuevoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProduccionHuevoDto)
  produccionesHuevo: ProduccionHuevoDto[];

  @ApiPropertyOptional({ type: [InventarioBandejaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventarioBandejaDto)
  inventarioBandejas?: InventarioBandejaDto[];
}
