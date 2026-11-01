import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoBandeja } from '@prisma/client';

export class CreateGallinaDto {
  @ApiProperty() @IsString() galponId: string;
  @ApiProperty() @IsDateString() fecha: string;
  @ApiProperty() @IsNumber() @Min(0) saldoInicial: number;
  @ApiProperty() @IsNumber() @Min(0) entradas: number;
  @ApiProperty() @IsNumber() @Min(0) mortalidad: number;
  @ApiProperty() @IsNumber() @Min(0) ventas: number;
  @ApiProperty() @IsNumber() @Min(0) traslados: number;
  @ApiPropertyOptional({ description: 'Calculado en el servidor. Se ignora si se envía.' })
  @IsOptional() @IsNumber() saldoFinal?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observaciones?: string;
}

export class CreateHuevoDto {
  @ApiProperty() @IsString() tipoHuevoId: string;
  @ApiProperty() @IsDateString() fecha: string;
  @ApiProperty() @IsNumber() @Min(0) saldoInicial: number;
  @ApiProperty() @IsNumber() @Min(0) produccion: number;
  @ApiProperty() @IsNumber() @Min(0) ventas: number;
  @ApiProperty() @IsNumber() @Min(0) perdidas: number;
  @ApiProperty() @IsNumber() @Min(0) consumo: number;
  @ApiPropertyOptional({ description: 'Calculado en el servidor. Se ignora si se envía.' })
  @IsOptional() @IsNumber() saldoFinal?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observaciones?: string;
}

export class CreateAlimentoDto {
  @ApiProperty() @IsString() galponId: string;
  @ApiProperty() @IsDateString() fecha: string;
  @ApiProperty() @IsNumber() @Min(0) saldoInicialKg: number;
  @ApiProperty() @IsNumber() @Min(0) entradasKg: number;
  @ApiProperty() @IsNumber() @Min(0) consumoKg: number;
  @ApiPropertyOptional({ description: 'Calculado en el servidor. Se ignora si se envía.' })
  @IsOptional() @IsNumber() saldoFinalKg?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() siloId?: string;
  @ApiPropertyOptional({ description: 'Campo legado; no se persiste.' })
  @IsOptional() @IsNumber() saldoInicialBultos?: number;
  @ApiPropertyOptional({ description: 'Campo legado; no se persiste.' })
  @IsOptional() @IsNumber() entradasBultos?: number;
  @ApiPropertyOptional({ description: 'Campo legado; no se persiste.' })
  @IsOptional() @IsNumber() consumoBultos?: number;
  @ApiPropertyOptional({ description: 'Campo legado; no se persiste.' })
  @IsOptional() @IsNumber() saldoFinalBultos?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observaciones?: string;
}

export class CreateBandejaDto {
  @ApiProperty() @IsString() galponId: string;
  @ApiProperty() @IsDateString() fecha: string;
  @ApiProperty({ enum: TipoBandeja }) @IsEnum(TipoBandeja) tipo: TipoBandeja;
  @ApiProperty() @IsNumber() @Min(0) entradas: number;
  @ApiProperty() @IsNumber() @Min(0) salidas: number;
  @ApiProperty() @IsNumber() @Min(0) saldoAnterior: number;
  @ApiPropertyOptional({ description: 'Calculado en el servidor. Se ignora si se envía.' })
  @IsOptional() @IsNumber() saldoBodega?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observaciones?: string;
}
