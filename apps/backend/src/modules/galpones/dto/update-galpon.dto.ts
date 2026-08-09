import { PartialType } from '@nestjs/swagger';
import { CreateGalponDto } from './create-galpon.dto';

export class UpdateGalponDto extends PartialType(CreateGalponDto) {}
