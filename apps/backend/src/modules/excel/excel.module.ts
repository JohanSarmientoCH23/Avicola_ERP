import { Module } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { ExcelController } from './excel.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ExcelController],
  providers: [ExcelService, PrismaService],
  exports: [ExcelService],
})
export class ExcelModule {}
