import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('diario')
  @ApiOperation({ summary: 'Reporte diario de producción' })
  getDiario(@Query('fecha') fecha: string) {
    return this.reportsService.getReporteDiario(fecha);
  }

  @Get('semanal')
  @ApiOperation({ summary: 'Reporte semanal' })
  getSemanal(@Query('fechaInicio') fechaInicio: string, @Query('fechaFin') fechaFin: string) {
    return this.reportsService.getReporteSemanal(fechaInicio, fechaFin);
  }

  @Get('mensual')
  @ApiOperation({ summary: 'Reporte mensual' })
  getMensual(@Query('anio') anio: number, @Query('mes') mes: number) {
    return this.reportsService.getReporteMensual(anio, mes);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar a CSV' })
  async exportCSV(@Query('tipo') tipo: string, @Query('fecha') fecha: string, @Res() res: Response) {
    const data = await this.reportsService.getCSVData(tipo, fecha);
    const csv = this.reportsService.generateCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${tipo}_${fecha || 'all'}.csv`);
    res.send(csv);
  }
}
