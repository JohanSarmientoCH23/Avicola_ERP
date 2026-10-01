import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DespachoDetalleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tipoHuevoId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  precioUnit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pesoTotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacion?: string;
}

export class CreateDespachoDto {
  @ApiProperty({ example: '2026-09-04' })
  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clienteId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guiaRemision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [DespachoDetalleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DespachoDetalleDto)
  detalles: DespachoDetalleDto[];
}
