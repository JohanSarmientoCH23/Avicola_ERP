import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Refresh token; si se omite se lee de la cookie httpOnly' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
