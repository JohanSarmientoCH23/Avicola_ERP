import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CostsService } from './costs.service';
import { CreateCostoDto } from './dto/create-costo.dto';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { CreateGastoFijoDto } from './dto/create-gasto-fijo.dto';
import { Rol } from '@prisma/client';

@ApiTags('Costos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('costs')
export class CostsController {
  constructor(private costsService: CostsService) {}

  @Post('categorias')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Crear categoría de costo' })
  createCategoria(@Body() dto: CreateCategoriaDto, @CurrentUser() user: any) {
    return this.costsService.createCategoria(dto, user.id, user.rol);
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Listar categorías' })
  getCategorias(@Query('tipo') tipo?: string) {
    return this.costsService.getCategorias(tipo);
  }

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Registrar costo directo' })
  createCosto(@Body() dto: CreateCostoDto, @CurrentUser() user: any) {
    return this.costsService.createCosto(dto, user.id, user.rol);
  }

  @Get()
  @ApiOperation({ summary: 'Listar costos' })
  getCostos(
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.costsService.getCostos({ tipo, estado, fechaInicio, fechaFin, page: Number(page) || 1, limit: Number(limit) || 20 });
  }

  @Post(':id/approve')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Aprobar costo' })
  approveCosto(@Param('id') id: string, @CurrentUser() user: any) {
    return this.costsService.approveCosto(id, user.id, user.rol);
  }

  @Post(':id/reject')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Rechazar costo' })
  rejectCosto(@Param('id') id: string, @CurrentUser() user: any) {
    return this.costsService.rejectCosto(id, user.id, user.rol);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de costos' })
  getResumenCostos(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.costsService.getResumenCostos(fechaInicio, fechaFin);
  }

  @Post('gastos-fijos')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Crear gasto fijo' })
  createGastoFijo(@Body() dto: CreateGastoFijoDto, @CurrentUser() user: any) {
    return this.costsService.createGastoFijo(dto, user.rol);
  }

  @Get('gastos-fijos')
  @ApiOperation({ summary: 'Listar gastos fijos' })
  getGastosFijos() {
    return this.costsService.getGastosFijos();
  }
}
