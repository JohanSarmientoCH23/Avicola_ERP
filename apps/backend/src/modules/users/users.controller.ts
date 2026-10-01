import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Rol } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear usuario' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any, @Req() req: Request) {
    return this.usersService.create(dto, user.id, req.ip);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Listar usuarios' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('rol') rol?: string,
    @Query('estado') estado?: string,
  ) {
    return this.usersService.findAll(pagination, { rol, estado });
  }

  @Get('stats')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Estadísticas de usuarios' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any, @Req() req: Request) {
    return this.usersService.update(id, dto, user.id, req.ip);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Desactivar usuario' })
  deactivate(@Param('id') id: string, @CurrentUser() user: any, @Req() req: Request) {
    return this.usersService.deactivate(id, user.id, req.ip);
  }
}
