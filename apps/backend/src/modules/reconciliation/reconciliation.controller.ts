import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReconciliationService } from './reconciliation.service';
import { Rol } from '@prisma/client';

@ApiTags('Conciliación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private reconciliationService: ReconciliationService) {}

  @Post('generate')
  @Roles(Rol.CONTADOR, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Generar conciliación contable diaria' })
  generate(@Body() body: { fecha: string }, @CurrentUser() user: any) {
    return this.reconciliationService.generate(body.fecha, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar conciliaciones' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reconciliationService.findAll({ page: +page, limit: +limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener conciliación detallada' })
  findOne(@Param('id') id: string) {
    return this.reconciliationService.findOne(id);
  }

  @Post(':id/approve')
  @Roles(Rol.CONTADOR, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Aprobar conciliación' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reconciliationService.approve(id, user.id);
  }

  @Post(':id/reject')
  @Roles(Rol.CONTADOR, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Rechazar conciliación' })
  reject(@Param('id') id: string, @Body('observaciones') observaciones: string) {
    return this.reconciliationService.reject(id, observaciones);
  }
}
