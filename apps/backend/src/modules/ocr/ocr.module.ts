import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { FormatParser } from './parser/format.parser';
import { ProductionModule } from '../production/production.module';

@Module({
  imports: [ProductionModule],
  controllers: [OcrController],
  providers: [OcrService, FormatParser],
  exports: [OcrService],
})
export class OcrModule {}
