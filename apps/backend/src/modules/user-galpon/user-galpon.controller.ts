import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserGalponService } from './user-galpon.service';
import { AssignGalponDto } from './dto/assign-galpon.dto';
import { Rol } from '@prisma/client';

@ApiTags('Asignación Galpones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user-galpon')
export class UserGalponController {
  constructor(private userGalponService: UserGalponService) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Asignar galpón a usuario' })
  assign(@Body() dto: AssignGalponDto) {
    return this.userGalponService.assign(dto);
  }

  @Delete(':usuarioId/:galponId')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Remover asignación de galpón' })
  unassign(@Param('usuarioId') usuarioId: string, @Param('galponId') galponId: string) {
    return this.userGalponService.unassign(usuarioId, galponId);
  }

  @Get('user/:usuarioId')
  @ApiOperation({ summary: 'Obtener galpones asignados a un usuario' })
  findByUser(@Param('usuarioId') usuarioId: string) {
    return this.userGalponService.findByUser(usuarioId);
  }

  @Get('galpon/:galponId')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener usuarios asignados a un galpón' })
  findByGalpon(@Param('galponId') galponId: string) {
    return this.userGalponService.findByGalpon(galponId);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listar todas las asignaciones' })
  findAll() {
    return this.userGalponService.findAll();
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar asignación por ID' })
  remove(@Param('id') id: string) {
    return this.userGalponService.remove(id);
  }
}
