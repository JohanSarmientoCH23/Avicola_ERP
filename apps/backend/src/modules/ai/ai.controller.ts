import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AiService } from './ai.service';
import { Rol } from '@prisma/client';

@ApiTags('IA - Analisis Inteligente')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('inconsistencias')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR, Rol.AUDITOR)
  @ApiOperation({ summary: 'Detectar inconsistencias en datos del dia' })
  detectInconsistencias(@Query('fecha') fecha: string) {
    return this.aiService.detectInconsistencias(fecha);
  }

  @Get('consumo-esperado')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR, Rol.RESPONSABLE_PRODUCCION)
  @ApiOperation({ summary: 'Calcular consumo esperado de alimento' })
  calcularConsumo(@Query('galponId') galponId: string, @Query('gallinas') gallinas: number) {
    return this.aiService.calcularConsumoEsperado(galponId, gallinas);
  }

  @Get('postura-esperada')
  @Roles(Rol.ADMINISTRADOR, Rol.CONTADOR, Rol.RESPONSABLE_PRODUCCION)
  @ApiOperation({ summary: 'Calcular postura esperada por edad' })
  calcularPostura(@Query('gallinas') gallinas: number, @Query('edadSemanas') edadSemanas: number) {
    return this.aiService.calcularPosturaEsperada(gallinas, edadSemanas);
  }
}
