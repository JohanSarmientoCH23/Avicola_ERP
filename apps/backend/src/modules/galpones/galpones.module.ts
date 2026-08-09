import { Module } from '@nestjs/common';
import { GalponesService } from './galpones.service';
import { GalponesController } from './galpones.controller';

@Module({
  controllers: [GalponesController],
  providers: [GalponesService],
  exports: [GalponesService],
})
export class GalponesModule {}
