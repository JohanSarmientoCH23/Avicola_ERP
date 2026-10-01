import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs del dashboard (filtrado por rol)' })
  getKPIs(@Query('fecha') fecha?: string, @CurrentUser() user?: any) {
    return this.dashboardService.getKPIs(fecha, user?.id, user?.rol);
  }

  @Get('produccion-por-galpon')
  @ApiOperation({ summary: 'Producción por galpón (filtrado por rol)' })
  getProduccionPorGalpon(@Query('fecha') fecha?: string, @CurrentUser() user?: any) {
    return this.dashboardService.getProduccionPorGalpon(fecha, user?.id, user?.rol);
  }

  @Get('tendencia-mensual')
  @ApiOperation({ summary: 'Tendencia mensual de producción (filtrado por rol)' })
  getTendenciaMensual(@Query('meses') meses?: number, @CurrentUser() user?: any) {
    return this.dashboardService.getTendenciaMensual(meses, user?.id, user?.rol);
  }

  @Get('mortalidad-por-galpon')
  @ApiOperation({ summary: 'Mortalidad por galpón con semáforo (filtrado por rol)' })
  getMortalidadPorGalpon(@Query('fecha') fecha?: string, @CurrentUser() user?: any) {
    return this.dashboardService.getMortalidadPorGalpon(fecha, user?.id, user?.rol);
  }

  @Get('resumen-diario')
  @ApiOperation({ summary: 'Resumen de reportes del día (filtrado por rol)' })
  getResumenDiario(@CurrentUser() user?: any) {
    return this.dashboardService.getResumenDiario(user?.id, user?.rol);
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
