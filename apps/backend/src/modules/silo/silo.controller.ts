import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SiloService } from './silo.service';
import { CreateSiloDto, UpdateSiloDto } from './dto';
import { Rol } from '@prisma/client';

@ApiTags('Silos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('silos')
export class SiloController {
  constructor(private siloService: SiloService) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENISTA)
  @ApiOperation({ summary: 'Crear un silo' })
  create(@Body() dto: CreateSiloDto) {
    return this.siloService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar silos' })
  @ApiQuery({ name: 'estado', required: false })
  findAll(@Query('estado') estado?: string) {
    return this.siloService.findAll(estado);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de silos' })
  getResumen() {
    return this.siloService.getResumen();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un silo por id' })
  findOne(@Param('id') id: string) {
    return this.siloService.findOne(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENISTA)
  @ApiOperation({ summary: 'Actualizar un silo' })
  update(@Param('id') id: string, @Body() dto: UpdateSiloDto) {
    return this.siloService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar un silo' })
  remove(@Param('id') id: string) {
    return this.siloService.remove(id);
  }

  @Put(':id/toggle-estado')
  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENISTA)
  @ApiOperation({ summary: 'Toggle estado del silo' })
  toggleEstado(@Param('id') id: string) {
    return this.siloService.toggleEstado(id);
  }
}
