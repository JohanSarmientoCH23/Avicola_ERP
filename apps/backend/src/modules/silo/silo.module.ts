import { Module } from '@nestjs/common';
import { SiloService } from './silo.service';
import { SiloController } from './silo.controller';

@Module({
  controllers: [SiloController],
  providers: [SiloService],
  exports: [SiloService],
})
export class SiloModule {}
