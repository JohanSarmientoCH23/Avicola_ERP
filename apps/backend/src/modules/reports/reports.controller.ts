import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportsService, ReportFilters } from './reports.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('diario')
  @ApiOperation({ summary: 'Reporte diario de producción' })
  getDiario(
    @Query('fecha') fecha?: string,
    @Query('galponId') galponId?: string,
    @Query('tipoHuevoId') tipoHuevoId?: string,
  ) {
    return this.reportsService.getReporteDiario({ fecha, galponId, tipoHuevoId });
  }

  @Get('semanal')
  @ApiOperation({ summary: 'Reporte semanal' })
  getSemanal(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('galponId') galponId?: string,
  ) {
    return this.reportsService.getReporteSemanal({ fechaInicio, fechaFin, galponId });
  }

  @Get('mensual')
  @ApiOperation({ summary: 'Reporte mensual' })
  getMensual(
    @Query('anio') anio: number,
    @Query('mes') mes: number,
    @Query('galponId') galponId?: string,
  ) {
    return this.reportsService.getReporteMensual(anio, mes, { galponId });
  }

  @Get('inventario/huevos')
  @ApiOperation({ summary: 'Reporte de inventario de huevos' })
  getInventarioHuevos(@Query('tipoHuevoId') tipoHuevoId?: string) {
    return this.reportsService.getReporteInventarioHuevos(tipoHuevoId);
  }

  @Get('inventario/alimento')
  @ApiOperation({ summary: 'Reporte de inventario de alimento' })
  getInventarioAlimento() {
    return this.reportsService.getReporteInventarioAlimento();
  }

  @Get('inventario/aves')
  @ApiOperation({ summary: 'Reporte de inventario de aves' })
  getInventarioAves(@Query('galponId') galponId?: string) {
    return this.reportsService.getReporteInventarioAves(galponId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar a CSV' })
  async exportCSV(
    @Query('tipo') tipo: string,
    @Query('fecha') fecha?: string,
    @Query('galponId') galponId?: string,
    @Query('tipoHuevoId') tipoHuevoId?: string,
    @Res() res?: Response,
  ) {
    const data = await this.reportsService.getCSVData(tipo, { fecha, galponId, tipoHuevoId });
    const csv = this.reportsService.generateCSV(data);
    if (res) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${tipo}_${fecha || 'all'}.csv`);
      res.send(csv);
    }
    return { csv, totalFilas: data.length };
  }
}
