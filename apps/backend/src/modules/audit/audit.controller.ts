import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { Rol } from '@prisma/client';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Listar registros de auditoría' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.auditService.findAll({ page: +page, limit: +limit });
  }

  @Get(':entidad/:entidadId')
  @Roles(Rol.ADMINISTRADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Auditoría por entidad' })
  findByEntity(@Param('entidad') entidad: string, @Param('entidadId') entidadId: string) {
    return this.auditService.findByEntity(entidad, entidadId);
  }
}
