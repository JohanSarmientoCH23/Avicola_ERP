import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { GalponAccessGuard } from '../../../common/guards/galpon-access.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GalponAccess } from '../../../common/decorators/galpon-access.decorator';
import { CreateGalponUseCase, GetGalponesUseCase, GetGalponUseCase, UpdateGalponUseCase, DeleteGalponUseCase } from '../../../domain/use-cases/galpones';
import { CreateGalponDto } from '../../../modules/galpones/dto/create-galpon.dto';
import { UpdateGalponDto } from '../../../modules/galpones/dto/update-galpon.dto';
import { Rol } from '@prisma/client';

@ApiTags('Galpones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, GalponAccessGuard)
@Controller('galpones')
export class GalponesHexaController {
  constructor(
    private readonly createGalponUseCase: CreateGalponUseCase,
    private readonly getGalponesUseCase: GetGalponesUseCase,
    private readonly getGalponUseCase: GetGalponUseCase,
    private readonly updateGalponUseCase: UpdateGalponUseCase,
    private readonly deleteGalponUseCase: DeleteGalponUseCase,
  ) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.CONTADOR)
  @ApiOperation({ summary: 'Crear galpón' })
  create(@Body() dto: CreateGalponDto) {
    return this.createGalponUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar galpones' })
  findAll() {
    return this.getGalponesUseCase.execute();
  }

  @Get(':id')
  @GalponAccess()
  @ApiOperation({ summary: 'Obtener galpón' })
  findOne(@Param('id') id: string) {
    return this.getGalponUseCase.execute(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.RESPONSABLE_PRODUCCION, Rol.CONTADOR)
  @GalponAccess()
  @ApiOperation({ summary: 'Actualizar galpón' })
  update(@Param('id') id: string, @Body() dto: UpdateGalponDto) {
    return this.updateGalponUseCase.execute({ id, data: dto });
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar galpón' })
  remove(@Param('id') id: string) {
    return this.deleteGalponUseCase.execute(id);
  }
}
