import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateGastoFijoDto {
  @IsString()
  conceptoId: string;

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
