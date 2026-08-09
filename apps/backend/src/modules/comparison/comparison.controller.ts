import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ComparisonService } from './comparison.service';
import { Rol } from '@prisma/client';

@ApiTags('Comparación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comparison')
export class ComparisonController {
  constructor(private comparisonService: ComparisonService) {}

  @Post('compare')
  @Roles(Rol.CONTADOR, Rol.ADMINISTRADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Comparar reporte OCR vs Excel' })
  async compare(
    @Body() body: { reporteOcrId: string; reporteExcelId: string },
    @CurrentUser() user: any,
  ) {
    return this.comparisonService.compare(body.reporteOcrId, body.reporteExcelId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar comparaciones' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.comparisonService.findAll({ page: +page, limit: +limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener comparación detallada' })
  findOne(@Param('id') id: string) {
    return this.comparisonService.findOne(id);
  }

  @Get('stats/:fecha')
  @ApiOperation({ summary: 'Estadísticas de comparación por fecha' })
  getStats(@Param('fecha') fecha: string) {
    return this.comparisonService.getStats(fecha);
  }
}
