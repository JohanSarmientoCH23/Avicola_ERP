import { IsString, IsNumber, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateGastoFijoDto {
  @IsString()
  concepto: string;

  @IsNumber()
  monto: number;

  @IsOptional()
  @IsString()
  recurrencia?: string;

  @IsOptional()
  @IsNumber()
  diaVencimiento?: number;

  @IsDateString()
  fechaInicio: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
