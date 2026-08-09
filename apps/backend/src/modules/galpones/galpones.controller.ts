import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GalponesService } from './galpones.service';
import { CreateGalponDto } from './dto/create-galpon.dto';
import { UpdateGalponDto } from './dto/update-galpon.dto';
import { Rol } from '@prisma/client';

@ApiTags('Galpones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('galpones')
export class GalponesController {
  constructor(private galponesService: GalponesService) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.CONTADOR)
  @ApiOperation({ summary: 'Crear galpón' })
  create(@Body() dto: CreateGalponDto) {
    return this.galponesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar galpones' })
  findAll() {
    return this.galponesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener galpón' })
  findOne(@Param('id') id: string) {
    return this.galponesService.findOne(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.CONTADOR)
  @ApiOperation({ summary: 'Actualizar galpón' })
  update(@Param('id') id: string, @Body() dto: UpdateGalponDto) {
    return this.galponesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar galpón' })
  remove(@Param('id') id: string) {
    return this.galponesService.remove(id);
  }
}
