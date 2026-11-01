import { Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors, Body, Query, Param, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExcelService } from './excel.service';
import { PrismaService } from '../../database/prisma.service';
import { Rol } from '@prisma/client';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

const multerConfig = {
  storage: diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + extname(file.originalname));
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(xlsx|xls|csv|xlsm)$/i)) {
      return cb(new BadRequestException('Solo se aceptan archivos .xlsx, .xls, .csv, .xlsm'), false);
    }
    cb(null, true);
  },
};

@ApiTags('Excel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('excel')
export class ExcelController {
  constructor(
    private excelService: ExcelService,
    private prisma: PrismaService,
  ) {
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
  }

  @Post('analyze')
  @Roles(Rol.RESPONSABLE_PRODUCCION, Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Analizar Excel - detecta hojas, encabezados y tipos' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async analyzeExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.excelService.analyzeExcel(file.path);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Vista previa del Excel con detección de estructura' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @Query('sheet') sheetName?: string,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.excelService.previewExcel(file.path, sheetName);
  }

  @Post('import')
  @Roles(Rol.RESPONSABLE_PRODUCCION, Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Importar Excel validado con transacciones' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.excelService.processExcel(file.path, user.id);
  }

  @Get('reportes')
  @ApiOperation({ summary: 'Listar reportes Excel importados' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async getReportes(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    const take = limit || 50;
    const skip = ((page || 1) - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.reporteExcel.findMany({
        skip,
        take,
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          fecha: true,
          nombreArchivo: true,
          estado: true,
          responsable: { select: { nombre: true, apellido: true } },
          createdAt: true,
        },
      }),
      this.prisma.reporteExcel.count(),
    ]);

    return { data, total, page: page || 1, totalPages: Math.ceil(total / take) };
  }

  @Get('reportes/:id')
  @ApiOperation({ summary: 'Obtener detalle de un reporte Excel' })
  async getReporte(@Param('id') id: string) {
    return this.prisma.reporteExcel.findUnique({
      where: { id },
      include: {
        responsable: { select: { nombre: true, apellido: true, email: true } },
        comparaciones: { select: { id: true, estado: true, fecha: true } },
      },
    });
  }
}
