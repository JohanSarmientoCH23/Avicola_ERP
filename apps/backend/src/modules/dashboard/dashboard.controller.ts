import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs del dashboard' })
  getKPIs(@Query('fecha') fecha?: string) {
    return this.dashboardService.getKPIs(fecha);
  }

  @Get('produccion-por-galpon')
  @ApiOperation({ summary: 'Producción por galpón' })
  getProduccionPorGalpon(@Query('fecha') fecha?: string) {
    return this.dashboardService.getProduccionPorGalpon(fecha);
  }

  @Get('tendencia-mensual')
  @ApiOperation({ summary: 'Tendencia mensual de producción' })
  getTendenciaMensual(@Query('meses') meses?: number) {
    return this.dashboardService.getTendenciaMensual(meses);
  }

  @Get('costos-resumen')
  @ApiOperation({ summary: 'Resumen de costos para dashboard' })
  getCostosResumen(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.dashboardService.getCostosResumen(fechaInicio, fechaFin);
  }
}
