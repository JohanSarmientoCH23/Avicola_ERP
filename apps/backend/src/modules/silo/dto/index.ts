import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSiloDto {
  @ApiProperty({ example: 'SILO-01' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  capacidad: number;

  @ApiPropertyOptional({ example: 'KG' })
  @IsOptional()
  @IsString()
  unidad?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'MANTENIMIENTO', 'INACTIVO'] })
  @IsOptional()
  @IsEnum(['ACTIVO', 'MANTENIMIENTO', 'INACTIVO'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateSiloDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacidad?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidad?: string;

  @ApiPropertyOptional({ enum: ['ACTIVO', 'MANTENIMIENTO', 'INACTIVO'] })
  @IsOptional()
  @IsEnum(['ACTIVO', 'MANTENIMIENTO', 'INACTIVO'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;
}
