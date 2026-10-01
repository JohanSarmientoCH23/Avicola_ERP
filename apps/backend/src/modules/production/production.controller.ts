import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GalponAccessGuard } from '../../common/guards/galpon-access.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GalponAccess } from '../../common/decorators/galpon-access.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductionService } from './production.service';
import { CreateReportDto } from './dto/create-report.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Rol } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Producción')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, GalponAccessGuard)
@Controller('production')
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Post('reports')
  @Roles(Rol.GALPONERO, Rol.RESPONSABLE_PRODUCCION, Rol.ADMINISTRADOR)
  @GalponAccess()
  @ApiOperation({ summary: 'Crear reporte diario de producción' })
  create(@Body() dto: CreateReportDto, @CurrentUser() user: any, @Req() req: Request) {
    return this.productionService.createReport(dto, user.id, user.rol, req.ip);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Listar reportes diarios' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('fecha') fecha?: string,
    @CurrentUser() user?: any,
  ) {
    return this.productionService.findAllReports(pagination, fecha, user?.id, user?.rol);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Obtener reporte' })
  findOne(@Param('id') id: string) {
    return this.productionService.findOneReport(id);
  }

  @Put('reports/:id/status')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Actualizar estado del reporte' })
  updateStatus(
    @Param('id') id: string,
    @Body('estado') estado: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.productionService.updateReportStatus(id, estado, user.id, req.ip);
  }

  @Get('tipos-huevo')
  @ApiOperation({ summary: 'Listar tipos de huevo' })
  getTiposHuevo() {
    return this.productionService.getTiposHuevo();
  }
}
