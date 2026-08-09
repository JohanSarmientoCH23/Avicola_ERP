import { PrismaClient, Rol, TipoHuevoCodigo, EstadoGalpon } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando base de datos...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@avicola.com' },
    update: {},
    create: {
      email: 'admin@avicola.com',
      password: hashedPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: Rol.ADMINISTRADOR,
    },
  });

  const contador = await prisma.usuario.upsert({
    where: { email: 'contador@avicola.com' },
    update: { nombre: 'Adriana', apellido: 'Chaves' },
    create: {
      email: 'contador@avicola.com',
      password: hashedPassword,
      nombre: 'Adriana',
      apellido: 'Chaves',
      rol: Rol.CONTADOR,
    },
  });

  const responsable = await prisma.usuario.upsert({
    where: { email: 'responsable@avicola.com' },
    update: {},
    create: {
      email: 'responsable@avicola.com',
      password: hashedPassword,
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      rol: Rol.RESPONSABLE_PRODUCCION,
    },
  });

  const galponero = await prisma.usuario.upsert({
    where: { email: 'galponero@avicola.com' },
    update: {},
    create: {
      email: 'galponero@avicola.com',
      password: hashedPassword,
      nombre: 'Pedro',
      apellido: 'Martínez',
      rol: Rol.GALPONERO,
    },
  });

  const auditor = await prisma.usuario.upsert({
    where: { email: 'auditor@avicola.com' },
    update: {},
    create: {
      email: 'auditor@avicola.com',
      password: hashedPassword,
      nombre: 'Ana',
      apellido: 'López',
      rol: Rol.AUDITOR,
    },
  });

  const almacenista = await prisma.usuario.upsert({
    where: { email: 'almacenista@avicola.com' },
    update: {},
    create: {
      email: 'almacenista@avicola.com',
      password: hashedPassword,
      nombre: 'Luis',
      apellido: 'Hernández',
      rol: Rol.ALMACENISTA,
    },
  });

  console.log('Usuarios creados');

  const tiposHuevo = [
    { codigo: TipoHuevoCodigo.JUMBO, nombre: 'Jumbo', pesoMin: 70, pesoMax: 80, orden: 1 },
    { codigo: TipoHuevoCodigo.EXTRA, nombre: 'Extra', pesoMin: 63, pesoMax: 70, orden: 2 },
    { codigo: TipoHuevoCodigo.AA, nombre: 'AA', pesoMin: 57, pesoMax: 63, orden: 3 },
    { codigo: TipoHuevoCodigo.A, nombre: 'A', pesoMin: 50, pesoMax: 57, orden: 4 },
    { codigo: TipoHuevoCodigo.B, nombre: 'B', pesoMin: 43, pesoMax: 50, orden: 5 },
    { codigo: TipoHuevoCodigo.REVOLTURA, nombre: 'Revoltura', pesoMin: 0, pesoMax: 43, orden: 6 },
    { codigo: TipoHuevoCodigo.C, nombre: 'C', pesoMin: 0, pesoMax: 0, orden: 7 },
    { codigo: TipoHuevoCodigo.PIPO, nombre: 'Pipo', pesoMin: 0, pesoMax: 0, orden: 8 },
    { codigo: TipoHuevoCodigo.BLANCO, nombre: 'Blanco', pesoMin: 0, pesoMax: 0, orden: 9 },
    { codigo: TipoHuevoCodigo.SUCIO, nombre: 'Sucio', pesoMin: 0, pesoMax: 0, orden: 10 },
    { codigo: TipoHuevoCodigo.ROTO, nombre: 'Roto', pesoMin: 0, pesoMax: 0, orden: 11 },
    { codigo: TipoHuevoCodigo.YEMAS, nombre: 'Yemas', pesoMin: 0, pesoMax: 0, orden: 12 },
  ];

  for (const tipo of tiposHuevo) {
    await prisma.tipoHuevo.upsert({
      where: { codigo: tipo.codigo },
      update: { nombre: tipo.nombre, pesoMin: tipo.pesoMin, pesoMax: tipo.pesoMax, orden: tipo.orden },
      create: tipo,
    });
  }

  console.log('Tipos de huevo creados');

  const lote = await prisma.lote.create({
    data: {
      nombre: 'Lote 01 - 2026',
      descripcion: 'Lote principal granja Llano Grande',
      fechaInicio: new Date('2026-01-15'),
      estado: 'ACTIVO',
    },
  });

  const galponCodes = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];
  const gallinasIniciales = [25000, 24500, 25000, 24800, 25000, 24500, 25000, 24800, 25000, 24500, 25000, 24800];

  for (let i = 0; i < galponCodes.length; i++) {
    await prisma.galpon.upsert({
      where: { codigo: galponCodes[i] },
      update: {},
      create: {
        codigo: galponCodes[i],
        capacidad: 25000,
        gallinasActuales: gallinasIniciales[i],
        estado: EstadoGalpon.ACTIVO,
        loteId: lote.id,
        descripcion: `Galpón ${galponCodes[i]} - Granja Llano Grande`,
      },
    });
  }

  console.log('Galpones creados');
  console.log('Base de datos sembrada exitosamente');
  console.log('\nCredenciales de acceso:');
  console.log('Admin: admin@avicola.com / password123');
  console.log('Contador: contador@avicola.com / password123');
  console.log('Responsable: responsable@avicola.com / password123');
  console.log('Galponero: galponero@avicola.com / password123');
  console.log('Auditor: auditor@avicola.com / password123');
  console.log('Almacenista: almacenista@avicola.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
