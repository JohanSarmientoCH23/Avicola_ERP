import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OcrService } from './ocr.service';
import { Rol } from '@prisma/client';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

@ApiTags('OCR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ocr')
export class OcrController {
  constructor(private ocrService: OcrService) {
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
  }

  @Post('process')
  @Roles(Rol.GALPONERO, Rol.RESPONSABLE_PRODUCCION, Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Procesar imagen del formato del galponero' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'ocr-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp|tiff|pdf)$/i)) {
        return cb(new BadRequestException('Solo se aceptan imagenes (jpg, png, etc) o PDF'), false);
      }
      cb(null, true);
    },
  }))
  async processImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No se recibio ninguna imagen');
    return this.ocrService.processImage(file.path, user.id);
  }

  @Post('process-url')
  @Roles(Rol.GALPONERO, Rol.RESPONSABLE_PRODUCCION, Rol.ADMINISTRADOR, Rol.CONTADOR)
  @ApiOperation({ summary: 'Procesar imagen desde URL' })
  async processImageUrl(
    @CurrentUser() user: any,
    body: { imageUrl: string },
  ) {
    return this.ocrService.processImage(body.imageUrl, user.id);
  }
}
