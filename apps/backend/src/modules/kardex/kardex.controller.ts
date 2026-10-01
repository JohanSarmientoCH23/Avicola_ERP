import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KardexService } from './kardex.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { Rol } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Kardex / Movimientos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kardex')
export class KardexController {
  constructor(private kardexService: KardexService) {}

  @Post('movimientos')
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.ALMACENISTA, Rol.GALPONERO)
  @ApiOperation({ summary: 'Crear movimiento de inventario' })
  create(@Body() dto: CreateMovimientoDto, @CurrentUser() user: any, @Req() req: Request) {
    return this.kardexService.createMovimiento(dto, user.id, req.ip);
  }

  @Get(':tipoProducto')
  @ApiOperation({ summary: 'Obtener kardex por tipo de producto' })
  getKardex(
    @Param('tipoProducto') tipoProducto: string,
    @Query('galponId') galponId?: string,
    @Query('tipoHuevoId') tipoHuevoId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.kardexService.getKardex(tipoProducto, {
      galponId, tipoHuevoId, fechaInicio, fechaFin, page, limit,
    });
  }

  @Get(':tipoProducto/resumen')
  @ApiOperation({ summary: 'Resumen de movimientos del mes' })
  getResumen(@Param('tipoProducto') tipoProducto: string, @Query('fecha') fecha?: string) {
    return this.kardexService.getResumen(tipoProducto, fecha);
  }

  @Get('galpon/:galponId')
  @ApiOperation({ summary: 'Historial de movimientos de un galpón' })
  getHistorialGalpon(@Param('galponId') galponId: string) {
    return this.kardexService.getHistorialGalpon(galponId);
  }
}
