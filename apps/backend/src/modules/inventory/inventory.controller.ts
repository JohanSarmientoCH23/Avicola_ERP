import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { InventoryService } from './inventory.service';
import { CreateGallinaDto, CreateHuevoDto, CreateAlimentoDto, CreateBandejaDto } from './dto/create-inventory.dto';
import { Rol } from '@prisma/client';

@ApiTags('Inventarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de todos los inventarios' })
  getResumen() {
    return this.inventoryService.getResumenInventarios();
  }

  @Get('gallinas/:galponId')
  @ApiOperation({ summary: 'Kardex de gallinas por galpón' })
  getGallinas(@Param('galponId') galponId: string, @Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.inventoryService.getKardexGallinas(galponId, fechaInicio, fechaFin);
  }

  @Post('gallinas')
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.ALMACENISTA)
  @ApiOperation({ summary: 'Crear/actualizar inventario gallinas' })
  createGallinas(@Body() dto: CreateGallinaDto) {
    return this.inventoryService.createOrUpdateGallina(dto);
  }

  @Get('huevos/:tipoHuevoId')
  @ApiOperation({ summary: 'Kardex de huevos por tipo' })
  getHuevos(@Param('tipoHuevoId') tipoHuevoId: string, @Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.inventoryService.getKardexHuevos(tipoHuevoId, fechaInicio, fechaFin);
  }

  @Post('huevos')
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.ALMACENISTA)
  @ApiOperation({ summary: 'Crear/actualizar inventario huevos' })
  createHuevos(@Body() dto: CreateHuevoDto) {
    return this.inventoryService.createOrUpdateHuevo(dto);
  }

  @Get('alimento/:galponId')
  @ApiOperation({ summary: 'Kardex de alimento por galpón' })
  getAlimento(@Param('galponId') galponId: string, @Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.inventoryService.getKardexAlimento(galponId, fechaInicio, fechaFin);
  }

  @Post('alimento')
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.ALMACENISTA)
  @ApiOperation({ summary: 'Crear/actualizar inventario alimento' })
  createAlimento(@Body() dto: CreateAlimentoDto) {
    return this.inventoryService.createOrUpdateAlimento(dto);
  }

  @Get('bandejas/:galponId')
  @ApiOperation({ summary: 'Kardex de bandejas por galpón' })
  getBandejas(@Param('galponId') galponId: string, @Query('fechaInicio') fechaInicio?: string, @Query('fechaFin') fechaFin?: string) {
    return this.inventoryService.getKardexBandejas(galponId, fechaInicio, fechaFin);
  }

  @Post('bandejas')
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.ALMACENISTA)
  @ApiOperation({ summary: 'Crear/actualizar inventario bandejas' })
  createBandejas(@Body() dto: CreateBandejaDto) {
    return this.inventoryService.createOrUpdateBandeja(dto);
  }
}
