import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GalponesModule } from './modules/galpones/galpones.module';
import { ProductionModule } from './modules/production/production.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { ExcelModule } from './modules/excel/excel.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { AiModule } from './modules/ai/ai.module';
import { CostsModule } from './modules/costs/costs.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    GalponesModule,
    ProductionModule,
    OcrModule,
    ExcelModule,
    ComparisonModule,
    InventoryModule,
    ReconciliationModule,
    DashboardModule,
    ReportsModule,
    AuditModule,
    AiModule,
    CostsModule,
  ],
})
export class AppModule {}
