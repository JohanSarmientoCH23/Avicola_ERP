import { IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateCostoDto {
  @IsString()
  categoriaId: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  monto: number;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  galponId?: string;

  @IsOptional()
  @IsString()
  comprobanteUrl?: string;
}
