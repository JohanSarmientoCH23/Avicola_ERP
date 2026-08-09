import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  async detectInconsistencias(fecha: string) {
    const fechaDate = new Date(fecha);
    const start = new Date(fechaDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(fechaDate);
    end.setHours(23, 59, 59, 999);

    const detalles = await this.prisma.detalleGalpon.findMany({
      where: { reporte: { fecha: { gte: start, lte: end } } },
      include: { galpon: true },
    });

    const inconsistencias: any[] = [];

    for (const d of detalles) {
      const gallinas = d.gallinas || d.galpon.gallinasActuales;
      const posturaPct = gallinas > 0 ? (d.produccion / gallinas) * 100 : 0;

      if (posturaPct > 100) {
        inconsistencias.push({
          tipo: 'VALOR_IMPROBABLE',
          galpon: d.galpon.codigo,
          campo: 'produccion',
          valor: d.produccion,
          mensaje: `La producción (${d.produccion}) excede las gallinas vivas (${gallinas})`,
          severidad: 'ALTA',
        });
      }

      if (d.mortalidad > gallinas * 0.05) {
        inconsistencias.push({
          tipo: 'MORTALIDAD_ALTA',
          galpon: d.galpon.codigo,
          campo: 'mortalidad',
          valor: d.mortalidad,
          mensaje: `Mortalidad del ${((d.mortalidad / gallinas) * 100).toFixed(2)}% supera el 5%`,
          severidad: 'ALTA',
        });
      }

      const consumoPorGallina = gallinas > 0 ? Number(d.alimentoConsumo) / gallinas : 0;
      if (consumoPorGallina > 150 || (consumoPorGallina > 0 && consumoPorGallina < 50)) {
        inconsistencias.push({
          tipo: 'CONSUMO_ANOMALO',
          galpon: d.galpon.codigo,
          campo: 'alimentoConsumo',
          valor: Number(d.alimentoConsumo),
          mensaje: `Consumo por gallina de ${consumoPorGallina.toFixed(2)}g fuera de rango normal`,
          severidad: 'MEDIA',
        });
      }
    }

    return { fecha, inconsistencias, total: inconsistencias.length };
  }

  async calcularConsumoEsperado(galponId: string, gallinas: number) {
    const consumoPromedio = 115;
    return {
      galponId,
      gallinas,
      consumoEsperado: gallinas * consumoPromedio / 1000,
      unidad: 'kg',
      nota: 'Basado en consumo promedio de 115g/gallina/día',
    };
  }

  async calcularPosturaEsperada(gallinas: number, edadSemanas: number) {
    let posturaEsperada = 0;
    if (edadSemanas >= 22 && edadSemanas <= 30) posturaEsperada = 92;
    else if (edadSemanas >= 31 && edadSemanas <= 50) posturaEsperada = 90;
    else if (edadSemanas >= 51 && edadSemanas <= 65) posturaEsperada = 85;
    else if (edadSemanas >= 66 && edadSemanas <= 80) posturaEsperada = 75;

    return {
      gallinas,
      edadSemanas,
      posturaEsperada,
      huevosEsperados: Math.round(gallinas * posturaEsperada / 100),
      unidad: '%',
    };
  }
}
