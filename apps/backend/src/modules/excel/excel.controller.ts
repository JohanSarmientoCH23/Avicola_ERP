import { Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors, Body, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
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

  @Post('import')
  @Roles(Rol.RESPONSABLE_PRODUCCION, Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Importar archivo Excel del responsable' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
        return cb(new BadRequestException('Solo se aceptan archivos .xlsx, .xls, .csv'), false);
      }
      cb(null, true);
    },
  }))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se recibio ningun archivo');
    return this.excelService.processExcel(file.path, user.id);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Vista previa del Excel' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  async preview(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibio ningun archivo');
    return this.excelService.getExcelPreview(file.path);
  }

  @Get('reportes')
  @ApiOperation({ summary: 'Listar reportes Excel importados' })
  async getReportes(@Query('limit') limit?: number) {
    return this.prisma.reporteExcel.findMany({
      take: limit || 50,
      orderBy: { fecha: 'desc' },
      select: { id: true, fecha: true, nombreArchivo: true, estado: true, createdAt: true },
    });
  }
}
