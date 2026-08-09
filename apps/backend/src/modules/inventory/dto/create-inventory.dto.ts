import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGallinaDto {
  @ApiProperty() @IsString() galponId: string;
  @ApiProperty() @IsDateString() fecha: string;
  @ApiProperty() @IsNumber() saldoInicial: number;
  @ApiProperty() @IsNumber() entradas: number;
  @ApiProperty() @IsNumber() mortalidad: number;
  @ApiProperty() @IsNumber() ventas: number;
  @ApiProperty() @IsNumber() traslados: number;
  @ApiProperty() @IsNumber() saldoFinal: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observaciones?: string;
}

export class CreateHuevoDto {
  @ApiProperty() @IsString() tipoHuevoId: string;
  @ApiProperty() @IsDateString() fecha: string;
  @ApiProperty() @IsNumber() saldoInicial: number;
  @ApiProperty() @IsNumber() produccion: number;
  @ApiProperty() @IsNumber() ventas: number;
  @ApiProperty() @IsNumber() perdidas: number;
  @ApiProperty() @IsNumber() consumo: number;
  @ApiProperty() @IsNumber() saldoFinal: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observaciones?: string;
}

export class CreateAlimentoDto {
  @ApiProperty() @IsString() galponId: string;
  @ApiProperty() @IsDateString() fecha: string;
  @ApiProperty() @IsNumber() saldoInicialKg: number;
  @ApiProperty() @IsNumber() entradasKg: number;
  @ApiProperty() @IsNumber() consumoKg: number;
  @ApiProperty() @IsNumber() saldoFinalKg: number;
  @ApiProperty() @IsNumber() saldoInicialBultos: number;
  @ApiProperty() @IsNumber() entradasBultos: number;
  @ApiProperty() @IsNumber() consumoBultos: number;
  @ApiProperty() @IsNumber() saldoFinalBultos: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observaciones?: string;
}

export class CreateBandejaDto {
  @ApiProperty() @IsString() galponId: string;
  @ApiProperty() @IsDateString() fecha: string;
  @ApiProperty() @IsString() tipo: string;
  @ApiProperty() @IsNumber() entradas: number;
  @ApiProperty() @IsNumber() salidas: number;
  @ApiProperty() @IsNumber() saldoAnterior: number;
  @ApiProperty() @IsNumber() saldoBodega: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observaciones?: string;
}
