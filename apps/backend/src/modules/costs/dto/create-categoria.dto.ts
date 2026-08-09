import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsEnum(['DIRECTO', 'INDIRECTO'] as const)
  tipo: 'DIRECTO' | 'INDIRECTO';
}
