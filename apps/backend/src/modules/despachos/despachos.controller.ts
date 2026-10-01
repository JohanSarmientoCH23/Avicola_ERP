import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DespachosService } from './despachos.service';
import { CreateDespachoDto } from './dto/create-despacho.dto';
import { Rol } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Despachos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('despachos')
export class DespachosController {
  constructor(private despachosService: DespachosService) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.ALMACENISTA)
  @ApiOperation({ summary: 'Crear despacho de huevos' })
  create(@Body() dto: CreateDespachoDto, @CurrentUser() user: any, @Req() req: Request) {
    return this.despachosService.create(dto, user.id, req.ip);
  }

  @Get()
  @ApiOperation({ summary: 'Listar despachos' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('estado') estado?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.despachosService.findAll({ page, limit, estado, fechaInicio, fechaFin });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener despacho detallado' })
  findOne(@Param('id') id: string) {
    return this.despachosService.findOne(id);
  }

  @Post(':id/approve')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Aprobar despacho' })
  approve(@Param('id') id: string, @CurrentUser() user: any, @Req() req: Request) {
    return this.despachosService.approve(id, user.id, req.ip);
  }

  @Post(':id/cancel')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Cancelar despacho' })
  cancel(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.despachosService.cancel(id, user.id, motivo, req.ip);
  }
}
