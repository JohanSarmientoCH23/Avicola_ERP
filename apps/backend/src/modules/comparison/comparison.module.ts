import { Module } from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import { ComparisonController } from './comparison.controller';
import { ProductionModule } from '../production/production.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [ProductionModule, ExcelModule],
  controllers: [ComparisonController],
  providers: [ComparisonService],
  exports: [ComparisonService],
})
export class ComparisonModule {}
