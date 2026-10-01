import { Module, Global } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PrismaUsuarioRepository } from './repositories/prisma-usuario.repository';
import { PrismaGalponRepository } from './repositories/prisma-galpon.repository';
import { PrismaReporteDiarioRepository } from './repositories/prisma-reporte-diario.repository';
import { PrismaReporteOcrDataRepository } from './repositories/prisma-reporte-ocr-data.repository';
import { PrismaCostoDirectoRepository } from './repositories/prisma-costo-directo.repository';
import { PrismaCostoAprobacionRepository } from './repositories/prisma-costo-aprobacion.repository';
import { PrismaDespachoRepository } from './repositories/prisma-despacho.repository';
import { PrismaDespachoAprobacionRepository } from './repositories/prisma-despacho-aprobacion.repository';
import { PrismaPermisoRepository } from './repositories/prisma-permiso.repository';
import { PrismaAuditAdapter } from './services/prisma-audit.adapter';

const repositories = [
  { provide: 'IUsuarioRepository', useClass: PrismaUsuarioRepository },
  { provide: 'IGalponRepository', useClass: PrismaGalponRepository },
  { provide: 'IReporteDiarioRepository', useClass: PrismaReporteDiarioRepository },
  { provide: 'IReporteOcrDataRepository', useClass: PrismaReporteOcrDataRepository },
  { provide: 'ICostoDirectoRepository', useClass: PrismaCostoDirectoRepository },
  { provide: 'ICostoAprobacionRepository', useClass: PrismaCostoAprobacionRepository },
  { provide: 'IDespachoRepository', useClass: PrismaDespachoRepository },
  { provide: 'IDespachoAprobacionRepository', useClass: PrismaDespachoAprobacionRepository },
  { provide: 'IPermisoRepository', useClass: PrismaPermisoRepository },
  { provide: 'IAuditPort', useClass: PrismaAuditAdapter },
];

@Global()
@Module({
  providers: [PrismaService, ...repositories],
  exports: [PrismaService, ...repositories],
})
export class InfrastructureModule {}
