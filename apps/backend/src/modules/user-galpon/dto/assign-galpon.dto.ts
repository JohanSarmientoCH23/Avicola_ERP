import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignGalponDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsString()
  @IsNotEmpty()
  usuarioId: string;

  @ApiProperty({ description: 'ID del galpón' })
  @IsString()
  @IsNotEmpty()
  galponId: string;
}
