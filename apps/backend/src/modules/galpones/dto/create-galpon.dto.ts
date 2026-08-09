import { IsString, IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoGalpon } from '@prisma/client';

export class CreateGalponDto {
  @ApiProperty({ example: '1A' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: 25000 })
  @IsInt()
  @Min(1)
  capacidad: number;

  @ApiPropertyOptional({ example: 24500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  gallinasActuales?: number;

  @ApiPropertyOptional({ enum: EstadoGalpon })
  @IsOptional()
  @IsEnum(EstadoGalpon)
  estado?: EstadoGalpon;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;
}
