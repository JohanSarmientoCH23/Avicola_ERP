import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { GalponesModule } from '../galpones/galpones.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [GalponesModule, AuditModule],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
