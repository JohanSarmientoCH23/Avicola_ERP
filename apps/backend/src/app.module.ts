import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuthHexaModule } from './adapters/web/auth/auth.hexa.module';
import { GalponesHexaModule } from './adapters/web/galpones/galpones.hexa.module';
import { UsersModule } from './modules/users/users.module';
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
import { UserGalponModule } from './modules/user-galpon/user-galpon.module';
import { KardexModule } from './modules/kardex/kardex.module';
import { DespachosModule } from './modules/despachos/despachos.module';
import { SiloModule } from './modules/silo/silo.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    DatabaseModule,
    InfrastructureModule,
    AuthHexaModule,
    UsersModule,
    GalponesHexaModule,
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
    UserGalponModule,
    KardexModule,
    DespachosModule,
    SiloModule,
  ],
})
export class AppModule {}
