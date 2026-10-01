import { PrismaClient, Rol, TipoHuevoCodigo, EstadoGalpon, TipoCosto, TipoBandeja } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_SEED_PASSWORD = process.env.SEED_PASSWORD || 'Avicola2026!';

async function main() {
  console.log('Sembrando base de datos...');

  const hashedPassword = await bcrypt.hash(DEFAULT_SEED_PASSWORD, 10);

  // ============================================================
  // USUARIOS
  // ============================================================
  const users = [
    { email: 'admin@avicola.com', nombre: 'Administrador', apellido: 'Sistema', rol: Rol.ADMINISTRADOR },
    { email: 'contador@avicola.com', nombre: 'Adriana', apellido: 'Chaves', rol: Rol.CONTADOR },
    { email: 'responsable@avicola.com', nombre: 'Carlos', apellido: 'Rodríguez', rol: Rol.RESPONSABLE_PRODUCCION },
    { email: 'galponero@avicola.com', nombre: 'Pedro', apellido: 'Martínez', rol: Rol.GALPONERO },
    { email: 'galponero2@avicola.com', nombre: 'Juan', apellido: 'García', rol: Rol.GALPONERO },
    { email: 'auditor@avicola.com', nombre: 'Ana', apellido: 'López', rol: Rol.AUDITOR },
    { email: 'almacenista@avicola.com', nombre: 'Luis', apellido: 'Hernández', rol: Rol.ALMACENISTA },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { password: hashedPassword },
      create: { ...u, password: hashedPassword },
    });
    createdUsers.push(user);
  }
  console.log('Usuarios creados');

  // ============================================================
  // PERMISOS Y ROLES
  // ============================================================
  const permisos = [
    { codigo: 'DASHBOARD_VER', descripcion: 'Ver dashboard', modulo: 'DASHBOARD' },
    { codigo: 'GALPONES_VER', descripcion: 'Ver galpones', modulo: 'GALPONES' },
    { codigo: 'GALPONES_CREAR', descripcion: 'Crear galpones', modulo: 'GALPONES' },
    { codigo: 'GALPONES_EDITAR', descripcion: 'Editar galpones', modulo: 'GALPONES' },
    { codigo: 'REPORTES_VER', descripcion: 'Ver reportes', modulo: 'REPORTES' },
    { codigo: 'REPORTES_CREAR', descripcion: 'Crear reportes diarios', modulo: 'REPORTES' },
    { codigo: 'PRODUCCION_VER', descripcion: 'Ver producción', modulo: 'PRODUCCION' },
    { codigo: 'PRODUCCION_CREAR', descripcion: 'Crear reportes de producción', modulo: 'PRODUCCION' },
    { codigo: 'OCR_CREAR', descripcion: 'Procesar OCR', modulo: 'OCR' },
    { codigo: 'EXCEL_VER', descripcion: 'Ver importaciones Excel', modulo: 'EXCEL' },
    { codigo: 'EXCEL_CREAR', descripcion: 'Importar Excel', modulo: 'EXCEL' },
    { codigo: 'COMPARACION_VER', descripcion: 'Ver comparaciones', modulo: 'COMPARACION' },
    { codigo: 'COMPARACION_CREAR', descripcion: 'Crear comparaciones', modulo: 'COMPARACION' },
    { codigo: 'INVENTARIO_VER', descripcion: 'Ver inventarios', modulo: 'INVENTARIO' },
    { codigo: 'INVENTARIO_CREAR', descripcion: 'Crear movimientos de inventario', modulo: 'INVENTARIO' },
    { codigo: 'CONCILIACION_VER', descripcion: 'Ver conciliaciones', modulo: 'CONCILIACION' },
    { codigo: 'CONCILIACION_CREAR', descripcion: 'Crear conciliaciones', modulo: 'CONCILIACION' },
    { codigo: 'CONCILIACION_APROBAR', descripcion: 'Aprobar conciliaciones', modulo: 'CONCILIACION' },
    { codigo: 'COSTOS_VER', descripcion: 'Ver costos', modulo: 'COSTOS' },
    { codigo: 'COSTOS_CREAR', descripcion: 'Crear costos', modulo: 'COSTOS' },
    { codigo: 'COSTOS_APROBAR', descripcion: 'Aprobar costos', modulo: 'COSTOS' },
    { codigo: 'DESPACHOS_VER', descripcion: 'Ver despachos', modulo: 'DESPACHOS' },
    { codigo: 'DESPACHOS_CREAR', descripcion: 'Crear despachos', modulo: 'DESPACHOS' },
    { codigo: 'DESPACHOS_APROBAR', descripcion: 'Aprobar despachos', modulo: 'DESPACHOS' },
    { codigo: 'USUARIOS_VER', descripcion: 'Ver usuarios', modulo: 'USUARIOS' },
    { codigo: 'USUARIOS_CREAR', descripcion: 'Crear usuarios', modulo: 'USUARIOS' },
    { codigo: 'USUARIOS_EDITAR', descripcion: 'Editar usuarios', modulo: 'USUARIOS' },
    { codigo: 'AUDITORIA_VER', descripcion: 'Ver auditoría', modulo: 'AUDITORIA' },
    { codigo: 'KARDEX_VER', descripcion: 'Ver kardex', modulo: 'KARDEX' },
    { codigo: 'KARDEX_CREAR', descripcion: 'Crear movimientos kardex', modulo: 'KARDEX' },
  ];

  for (const p of permisos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: { descripcion: p.descripcion, modulo: p.modulo },
      create: p,
    });
  }

  // Asignar permisos por rol
  const rolPermisosMap: Record<Rol, string[]> = {
    [Rol.ADMINISTRADOR]: permisos.map((p) => p.codigo),
    [Rol.CONTADOR]: ['DASHBOARD_VER', 'REPORTES_VER', 'EXCEL_VER', 'EXCEL_CREAR', 'COMPARACION_VER', 'COMPARACION_CREAR', 'CONCILIACION_VER', 'CONCILIACION_CREAR', 'CONCILIACION_APROBAR', 'COSTOS_VER', 'COSTOS_CREAR', 'COSTOS_APROBAR', 'DESPACHOS_VER', 'DESPACHOS_APROBAR', 'INVENTARIO_VER', 'AUDITORIA_VER'],
    [Rol.RESPONSABLE_PRODUCCION]: ['DASHBOARD_VER', 'GALPONES_VER', 'GALPONES_CREAR', 'GALPONES_EDITAR', 'REPORTES_VER', 'REPORTES_CREAR', 'PRODUCCION_VER', 'PRODUCCION_CREAR', 'OCR_CREAR', 'EXCEL_VER', 'COMPARACION_VER', 'INVENTARIO_VER', 'INVENTARIO_CREAR', 'KARDEX_VER', 'KARDEX_CREAR'],
    [Rol.GALPONERO]: ['DASHBOARD_VER', 'GALPONES_VER', 'REPORTES_CREAR', 'PRODUCCION_CREAR', 'INVENTARIO_VER'],
    [Rol.AUDITOR]: ['DASHBOARD_VER', 'REPORTES_VER', 'COMPARACION_VER', 'CONCILIACION_VER', 'AUDITORIA_VER', 'KARDEX_VER'],
    [Rol.ALMACENISTA]: ['DASHBOARD_VER', 'INVENTARIO_VER', 'INVENTARIO_CREAR', 'DESPACHOS_VER', 'DESPACHOS_CREAR', 'KARDEX_VER', 'KARDEX_CREAR'],
  };

  for (const [rol, permisoCodigos] of Object.entries(rolPermisosMap)) {
    for (const codigo of permisoCodigos) {
      const permiso = await prisma.permiso.findUnique({ where: { codigo } });
      if (permiso) {
        await prisma.rolPermiso.upsert({
          where: { rol_permisoId: { rol: rol as Rol, permisoId: permiso.id } },
          update: {},
          create: { rol: rol as Rol, permisoId: permiso.id },
        });
      }
    }
  }
  console.log('Permisos y roles configurados');
  console.log('Usuarios creados');

  // ============================================================
  // PERMISOS Y ROLES
  // ============================================================
  const permisos = [
    { codigo: 'DASHBOARD_VER', descripcion: 'Ver dashboard', modulo: 'DASHBOARD' },
    { codigo: 'GALPONES_VER', descripcion: 'Ver galpones', modulo: 'GALPONES' },
    { codigo: 'GALPONES_CREAR', descripcion: 'Crear galpones', modulo: 'GALPONES' },
    { codigo: 'GALPONES_EDITAR', descripcion: 'Editar galpones', modulo: 'GALPONES' },
    { codigo: 'REPORTES_VER', descripcion: 'Ver reportes', modulo: 'REPORTES' },
    { codigo: 'REPORTES_CREAR', descripcion: 'Crear reportes diarios', modulo: 'REPORTES' },
    { codigo: 'PRODUCCION_VER', descripcion: 'Ver producción', modulo: 'PRODUCCION' },
    { codigo: 'PRODUCCION_CREAR', descripcion: 'Crear reportes de producción', modulo: 'PRODUCCION' },
    { codigo: 'OCR_CREAR', descripcion: 'Procesar OCR', modulo: 'OCR' },
    { codigo: 'EXCEL_VER', descripcion: 'Ver importaciones Excel', modulo: 'EXCEL' },
    { codigo: 'EXCEL_CREAR', descripcion: 'Importar Excel', modulo: 'EXCEL' },
    { codigo: 'COMPARACION_VER', descripcion: 'Ver comparaciones', modulo: 'COMPARACION' },
    { codigo: 'COMPARACION_CREAR', descripcion: 'Crear comparaciones', modulo: 'COMPARACION' },
    { codigo: 'INVENTARIO_VER', descripcion: 'Ver inventarios', modulo: 'INVENTARIO' },
    { codigo: 'INVENTARIO_CREAR', descripcion: 'Crear movimientos de inventario', modulo: 'INVENTARIO' },
    { codigo: 'CONCILIACION_VER', descripcion: 'Ver conciliaciones', modulo: 'CONCILIACION' },
    { codigo: 'CONCILIACION_CREAR', descripcion: 'Crear conciliaciones', modulo: 'CONCILIACION' },
    { codigo: 'CONCILIACION_APROBAR', descripcion: 'Aprobar conciliaciones', modulo: 'CONCILIACION' },
    { codigo: 'COSTOS_VER', descripcion: 'Ver costos', modulo: 'COSTOS' },
    { codigo: 'COSTOS_CREAR', descripcion: 'Crear costos', modulo: 'COSTOS' },
    { codigo: 'COSTOS_APROBAR', descripcion: 'Aprobar costos', modulo: 'COSTOS' },
    { codigo: 'DESPACHOS_VER', descripcion: 'Ver despachos', modulo: 'DESPACHOS' },
    { codigo: 'DESPACHOS_CREAR', descripcion: 'Crear despachos', modulo: 'DESPACHOS' },
    { codigo: 'DESPACHOS_APROBAR', descripcion: 'Aprobar despachos', modulo: 'DESPACHOS' },
    { codigo: 'USUARIOS_VER', descripcion: 'Ver usuarios', modulo: 'USUARIOS' },
    { codigo: 'USUARIOS_CREAR', descripcion: 'Crear usuarios', modulo: 'USUARIOS' },
    { codigo: 'USUARIOS_EDITAR', descripcion: 'Editar usuarios', modulo: 'USUARIOS' },
    { codigo: 'AUDITORIA_VER', descripcion: 'Ver auditoría', modulo: 'AUDITORIA' },
    { codigo: 'KARDEX_VER', descripcion: 'Ver kardex', modulo: 'KARDEX' },
    { codigo: 'KARDEX_CREAR', descripcion: 'Crear movimientos kardex', modulo: 'KARDEX' },
  ];

  for (const p of permisos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: { descripcion: p.descripcion, modulo: p.modulo },
      create: p,
    });
  }

  // Asignar permisos por rol
  const rolPermisosMap: Record<Rol, string[]> = {
    [Rol.ADMINISTRADOR]: permisos.map((p) => p.codigo),
    [Rol.CONTADOR]: ['DASHBOARD_VER', 'REPORTES_VER', 'EXCEL_VER', 'EXCEL_CREAR', 'COMPARACION_VER', 'COMPARACION_CREAR', 'CONCILIACION_VER', 'CONCILIACION_CREAR', 'CONCILIACION_APROBAR', 'COSTOS_VER', 'COSTOS_CREAR', 'COSTOS_APROBAR', 'DESPACHOS_VER', 'DESPACHOS_APROBAR', 'INVENTARIO_VER', 'AUDITORIA_VER'],
    [Rol.RESPONSABLE_PRODUCCION]: ['DASHBOARD_VER', 'GALPONES_VER', 'GALPONES_CREAR', 'GALPONES_EDITAR', 'REPORTES_VER', 'REPORTES_CREAR', 'PRODUCCION_VER', 'PRODUCCION_CREAR', 'OCR_CREAR', 'EXCEL_VER', 'COMPARACION_VER', 'INVENTARIO_VER', 'INVENTARIO_CREAR', 'KARDEX_VER', 'KARDEX_CREAR'],
    [Rol.GALPONERO]: ['DASHBOARD_VER', 'GALPONES_VER', 'REPORTES_CREAR', 'PRODUCCION_CREAR', 'INVENTARIO_VER'],
    [Rol.AUDITOR]: ['DASHBOARD_VER', 'REPORTES_VER', 'COMPARACION_VER', 'CONCILIACION_VER', 'AUDITORIA_VER', 'KARDEX_VER'],
    [Rol.ALMACENISTA]: ['DASHBOARD_VER', 'INVENTARIO_VER', 'INVENTARIO_CREAR', 'DESPACHOS_VER', 'DESPACHOS_CREAR', 'KARDEX_VER', 'KARDEX_CREAR'],
  };

  for (const [rol, permisoCodigos] of Object.entries(rolPermisosMap)) {
    for (const codigo of permisoCodigos) {
      const permiso = await prisma.permiso.findUnique({ where: { codigo } });
      if (permiso) {
        await prisma.rolPermiso.upsert({
          where: { rol_permisoId: { rol: rol as Rol, permisoId: permiso.id } },
          update: {},
          create: { rol: rol as Rol, permisoId: permiso.id },
        });
      }
    }
  }
  console.log('Permisos y roles configurados');

  // ============================================================
  // TIPOS DE HUEVO
  // ============================================================
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

  // ============================================================
  // CLIENTES
  // ============================================================
  const clientes = [
    { razonSocial: 'Distribuidora Avícola del Norte S.A.', ruc: '1234567890-1', direccion: 'Calle 10 #45-67, Bogotá', telefono: '+57 1 234 5678', email: 'ventas@distravinorte.com' },
    { razonSocial: 'Supermercados La Granja Ltda.', ruc: '2345678901-2', direccion: 'Av. 68 #40-30, Medellín', telefono: '+57 4 321 9876', email: 'compras@lagranja.com' },
    { razonSocial: 'Huevos Frescos del Campo S.A.S.', ruc: '3456789012-3', direccion: 'Carrera 15 #80-25, Cali', telefono: '+57 2 555 1234', email: 'pedidos@huevosfrescos.com' },
    { razonSocial: 'Distribuidora Central de Alimentos', ruc: '4567890123-4', direccion: 'Zona Franca, Cota', telefono: '+57 1 789 4561', email: 'logistica@dca.com' },
    { razonSocial: 'Restaurantes El Corral S.A.', ruc: '5678901234-5', direccion: 'Centro Comercial Andino, Bogotá', telefono: '+57 1 345 6789', email: 'supply@elcorral.com' },
  ];

  const createdClientes = [];
  for (const c of clientes) {
    const cliente = await prisma.cliente.upsert({
      where: { ruc: c.ruc! },
      update: {},
      create: c,
    });
    createdClientes.push(cliente);
  }
  console.log('Clientes creados');

  // ============================================================
  // CATEGORÍAS Y CONCEPTOS DE COSTO
  // ============================================================
  const categoriasCosto = [
    { nombre: 'Alimento', descripcion: 'Alimento balanceado para aves', tipo: TipoCosto.DIRECTO },
    { nombre: 'Medicamentos', descripcion: 'Vacunas, antibióticos, vitaminas', tipo: TipoCosto.DIRECTO },
    { nombre: 'Mano de Obra', descripcion: 'Personal operativo', tipo: TipoCosto.DIRECTO },
    { nombre: 'Servicios Públicos', descripcion: 'Energía, agua, gas', tipo: TipoCosto.INDIRECTO },
    { nombre: 'Mantenimiento', descripcion: 'Reparaciones, repuestos', tipo: TipoCosto.INDIRECTO },
    { nombre: 'Administrativo', descripcion: 'Gastos de oficina, seguros', tipo: TipoCosto.INDIRECTO },
  ];

  const createdCategorias = [];
  for (const cat of categoriasCosto) {
    const categoria = await prisma.categoriaCosto.upsert({
      where: { nombre: cat.nombre },
      update: { descripcion: cat.descripcion, tipo: cat.tipo },
      create: cat,
    });
    createdCategorias.push(categoria);
  }

  const conceptosCosto = [
    { categoriaNombre: 'Alimento', nombre: 'Alimento Inicio', descripcion: 'Alimento para pollitas 0-6 semanas', unidadMedida: 'KG' },
    { categoriaNombre: 'Alimento', nombre: 'Alimento Crecimiento', descripcion: 'Alimento para pollitas 7-16 semanas', unidadMedida: 'KG' },
    { categoriaNombre: 'Alimento', nombre: 'Alimento Postura', descripcion: 'Alimento para gallinas en producción', unidadMedida: 'KG' },
    { categoriaNombre: 'Medicamentos', nombre: 'Vacuna Newcastle', descripcion: 'Vacuna contra enfermedad de Newcastle', unidadMedida: 'DOSIS' },
    { categoriaNombre: 'Medicamentos', nombre: 'Vacuna Bronquitis', descripcion: 'Vacuna contra bronquitis infecciosa', unidadMedida: 'DOSIS' },
    { categoriaNombre: 'Medicamentos', nombre: 'Antibiótico', descripcion: 'Tratamiento respiratorio', unidadMedida: 'FRASCO' },
    { categoriaNombre: 'Mano de Obra', nombre: 'Galponero', descripcion: 'Salario mensual galponero', unidadMedida: 'MES' },
    { categoriaNombre: 'Mano de Obra', nombre: 'Almacenista', descripcion: 'Salario mensual almacenista', unidadMedida: 'MES' },
    { categoriaNombre: 'Servicios Públicos', nombre: 'Energía Eléctrica', descripcion: 'Consumo mensual energía', unidadMedida: 'KWH' },
    { categoriaNombre: 'Servicios Públicos', nombre: 'Agua', descripcion: 'Consumo mensual agua', unidadMedida: 'M3' },
    { categoriaNombre: 'Mantenimiento', nombre: 'Reparación Bebederos', descripcion: 'Mantenimiento sistema bebida', unidadMedida: 'UND' },
    { categoriaNombre: 'Mantenimiento', nombre: 'Reparación Ventilación', descripcion: 'Mantenimiento extractores', unidadMedida: 'UND' },
    { categoriaNombre: 'Administrativo', nombre: 'Seguro Granja', descripcion: 'Póliza anual todo riesgo', unidadMedida: 'AÑO' },
    { categoriaNombre: 'Administrativo', nombre: 'Papelería', descripcion: 'Útiles de oficina', unidadMedida: 'UND' },
  ];

  for (const concepto of conceptosCosto) {
    const categoria = createdCategorias.find((c) => c.nombre === concepto.categoriaNombre);
    if (categoria) {
      await prisma.conceptoCosto.upsert({
        where: { categoriaId_nombre: { categoriaId: categoria.id, nombre: concepto.nombre } },
        update: { descripcion: concepto.descripcion, unidadMedida: concepto.unidadMedida },
        create: { categoriaId: categoria.id, nombre: concepto.nombre, descripcion: concepto.descripcion, unidadMedida: concepto.unidadMedida },
      });
    }
  }
  console.log('Categorías y conceptos de costo creados');

  // ============================================================
  // CONCEPTOS DE GASTO FIJO
  // ============================================================
  const conceptosGasto = [
    { nombre: 'Arriendo Terreno', descripcion: 'Arriendo mensual predio', categoria: 'ARRIENDO' },
    { nombre: 'Seguro Vehículos', descripcion: 'Seguro flota camiones', categoria: 'SEGUROS' },
    { nombre: 'Servicios Contables', descripcion: 'Honorarios contador externo', categoria: 'PROFESIONALES' },
    { nombre: 'Mantenimiento Equipos', descripcion: 'Contrato mantenimiento preventivo', categoria: 'MANTENIMIENTO' },
    { nombre: 'Capacitación Personal', descripcion: 'Cursos y certificaciones', categoria: 'CAPACITACION' },
  ];

  for (const cg of conceptosGasto) {
    await prisma.conceptoGasto.upsert({
      where: { nombre: cg.nombre },
      update: { descripcion: cg.descripcion, categoria: cg.categoria },
      create: cg,
    });
  }
  console.log('Conceptos de gasto fijo creados');

  // ============================================================
  // CONCEPTOS DE CONCILIACIÓN
  // ============================================================
  const conceptosConciliacion = [
    { nombre: 'Producción Total', descripcion: 'Total huevos producidos', modulo: 'CONCILIACION' },
    { nombre: 'Mortalidad', descripcion: 'Aves muertas en el día', modulo: 'CONCILIACION' },
    { nombre: 'Alimento Entrada', descripcion: 'Kg alimento ingresado', modulo: 'CONCILIACION' },
    { nombre: 'Alimento Consumo', descripcion: 'Kg alimento consumido', modulo: 'CONCILIACION' },
    { nombre: 'Gallinas Vivas', descripcion: 'Inventario aves vivas', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación JUMBO', descripcion: 'Huevos tipo Jumbo', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación EXTRA', descripcion: 'Huevos tipo Extra', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación AA', descripcion: 'Huevos tipo AA', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación A', descripcion: 'Huevos tipo A', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación B', descripcion: 'Huevos tipo B', modulo: 'CONCILIACION' },
    { nombre: 'Bandejas AA', descripcion: 'Inventario bandejas AA', modulo: 'CONCILIACION' },
    { nombre: 'Bandejas A', descripcion: 'Inventario bandejas A', modulo: 'CONCILIACION' },
    { nombre: 'Bandejas B', descripcion: 'Inventario bandejas B', modulo: 'CONCILIACION' },
  ];

  for (const cc of conceptosConciliacion) {
    await prisma.conceptoConciliacion.upsert({
      where: { nombre: cc.nombre },
      update: { descripcion: cc.descripcion, modulo: cc.modulo },
      create: cc,
    });
  }
  console.log('Conceptos de conciliación creados');
  console.log('Categorías y conceptos de costo creados');

  // ============================================================
  // CONCEPTOS DE GASTO FIJO
  // ============================================================
  const conceptosGasto = [
    { nombre: 'Arriendo Terreno', descripcion: 'Arriendo mensual predio', categoria: 'ARRIENDO' },
    { nombre: 'Seguro Vehículos', descripcion: 'Seguro flota camiones', categoria: 'SEGUROS' },
    { nombre: 'Servicios Contables', descripcion: 'Honorarios contador externo', categoria: 'PROFESIONALES' },
    { nombre: 'Mantenimiento Equipos', descripcion: 'Contrato mantenimiento preventivo', categoria: 'MANTENIMIENTO' },
    { nombre: 'Capacitación Personal', descripcion: 'Cursos y certificaciones', categoria: 'CAPACITACION' },
  ];

  for (const cg of conceptosGasto) {
    await prisma.conceptoGasto.upsert({
      where: { nombre: cg.nombre },
      update: { descripcion: cg.descripcion, categoria: cg.categoria },
      create: cg,
    });
  }
  console.log('Conceptos de gasto fijo creados');

  // ============================================================
  // CONCEPTOS DE CONCILIACIÓN
  // ============================================================
  const conceptosConciliacion = [
    { nombre: 'Producción Total', descripcion: 'Total huevos producidos', modulo: 'CONCILIACION' },
    { nombre: 'Mortalidad', descripcion: 'Aves muertas en el día', modulo: 'CONCILIACION' },
    { nombre: 'Alimento Entrada', descripcion: 'Kg alimento ingresado', modulo: 'CONCILIACION' },
    { nombre: 'Alimento Consumo', descripcion: 'Kg alimento consumido', modulo: 'CONCILIACION' },
    { nombre: 'Gallinas Vivas', descripcion: 'Inventario aves vivas', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación JUMBO', descripcion: 'Huevos tipo Jumbo', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación EXTRA', descripcion: 'Huevos tipo Extra', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación AA', descripcion: 'Huevos tipo AA', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación A', descripcion: 'Huevos tipo A', modulo: 'CONCILIACION' },
    { nombre: 'Clasificación B', descripcion: 'Huevos tipo B', modulo: 'CONCILIACION' },
    { nombre: 'Bandejas AA', descripcion: 'Inventario bandejas AA', modulo: 'CONCILIACION' },
    { nombre: 'Bandejas A', descripcion: 'Inventario bandejas A', modulo: 'CONCILIACION' },
    { nombre: 'Bandejas B', descripcion: 'Inventario bandejas B', modulo: 'CONCILIACION' },
  ];

  for (const cc of conceptosConciliacion) {
    await prisma.conceptoConciliacion.upsert({
      where: { nombre: cc.nombre },
      update: { descripcion: cc.descripcion, modulo: cc.modulo },
      create: cc,
    });
  }
  console.log('Conceptos de conciliación creados');

  // ============================================================
  // SILOS
  // ============================================================
  const silos = [
    { codigo: 'SILO-01', capacidad: 20000, unidad: 'KG', descripcion: 'Silo principal galpones 1-2' },
    { codigo: 'SILO-02', capacidad: 20000, unidad: 'KG', descripcion: 'Silo principal galpones 3-4' },
    { codigo: 'SILO-03', capacidad: 15000, unidad: 'KG', descripcion: 'Silo galpones 5-6' },
    { codigo: 'SILO-04', capacidad: 10000, unidad: 'KG', descripcion: 'Silo reserva' },
  ];

  for (const s of silos) {
    await prisma.silo.upsert({
      where: { codigo: s.codigo },
      update: { capacidad: s.capacidad, unidad: s.unidad, descripcion: s.descripcion },
      create: s,
    });
  }
  console.log('Silos creados');

  // ============================================================
  // LOTE Y GALPONES
  // ============================================================
  const lote = await prisma.lote.upsert({
    where: { nombre: 'Lote 01 - 2026' },
    update: {},
    create: {
      nombre: 'Lote 01 - 2026',
      descripcion: 'Lote principal granja Llano Grande',
      fechaInicio: new Date('2026-01-15'),
      estado: 'ACTIVO',
    },
  });

  const galponCodes = ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];
  const gallinasIniciales = [25000, 24500, 25000, 24800, 25000, 24500, 25000, 24800, 25000, 24500, 25000, 24800];

  const createdGalpones = [];
  for (let i = 0; i < galponCodes.length; i++) {
    const galpon = await prisma.galpon.upsert({
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
    createdGalpones.push(galpon);
  }
  console.log('Galpones creados');

  // ============================================================
  // ASIGNAR GALPONES A GALPONEROS
  // ============================================================
  const galponeros = createdUsers.filter((u) => u.rol === Rol.GALPONERO);
  for (let i = 0; i < galponeros.length; i++) {
    const startIdx = i * 6;
    for (let j = 0; j < 6 && startIdx + j < createdGalpones.length; j++) {
      await prisma.usuarioGalpon.upsert({
        where: { usuarioId_galponId: { usuarioId: galponeros[i].id, galponId: createdGalpones[startIdx + j].id } },
        update: {},
        create: { usuarioId: galponeros[i].id, galponId: createdGalpones[startIdx + j].id },
      });
    }
  }
  console.log('Galpones asignados a galponeros');

  // ============================================================
  // INVENTARIO INICIAL (Última semana)
  // ============================================================
  const today = new Date();
  for (let day = -6; day <= 0; day++) {
    const fecha = new Date(today);
    fecha.setDate(fecha.getDate() + day);
    fecha.setHours(0, 0, 0, 0);

    // Inventario gallinas por galpón
    for (const g of createdGalpones) {
      const mortalidad = Math.floor(Math.random() * 15) + 5;
      const ventas = Math.floor(Math.random() * 10);
      const traslados = 0;

      await prisma.inventarioGallina.upsert({
        where: { galponId_fecha: { galponId: g.id, fecha } },
        update: {},
        create: {
          galponId: g.id,
          fecha,
          saldoInicial: g.gallinasActuales,
          entradas: 0,
          mortalidad,
          ventas,
          traslados,
          saldoFinal: g.gallinasActuales - mortalidad - ventas,
        },
      });
    }

    // Inventario huevos por tipo
    const tiposHuevoDb = await prisma.tipoHuevo.findMany({ where: { activo: true } });
    for (const th of tiposHuevoDb) {
      const produccion = Math.floor(Math.random() * 2000) + 500;
      const ventas = Math.floor(Math.random() * 1500);
      const perdidas = Math.floor(Math.random() * 50);
      const consumo = Math.floor(Math.random() * 100);

      await prisma.inventarioHuevo.upsert({
        where: { tipoHuevoId_fecha: { tipoHuevoId: th.id, fecha } },
        update: {},
        create: {
          tipoHuevoId: th.id,
          fecha,
          saldoInicial: 5000,
          produccion,
          ventas,
          perdidas,
          consumo,
          saldoFinal: 5000 + produccion - ventas - perdidas - consumo,
        },
      });
    }

    // Inventario alimento por galpón
    for (const g of createdGalpones) {
      await prisma.inventarioAlimento.upsert({
        where: { galponId_fecha: { galponId: g.id, fecha } },
        update: {},
        create: {
          galponId: g.id,
          fecha,
          saldoInicialKg: 5000,
          entradasKg: 2000,
          consumoKg: 1800 + Math.random() * 200,
          saldoFinalKg: 5200,
        },
      });
    }

    // Inventario bandejas por galpón
    for (const g of createdGalpones) {
      for (const tipo of [TipoBandeja.AA, TipoBandeja.A, TipoBandeja.B]) {
        await prisma.inventarioBandeja.upsert({
          where: { galponId_fecha_tipo: { galponId: g.id, fecha, tipo } },
          update: {},
          create: {
            galponId: g.id,
            fecha,
            tipo,
            entradas: Math.floor(Math.random() * 50),
            salidas: Math.floor(Math.random() * 40),
            saldoAnterior: 200,
            saldoBodega: 210,
          },
        });
      }
    }
  }
  console.log('Inventarios iniciales creados');

  console.log('\n✅ Base de datos sembrada exitosamente');
  console.log('\n📋 Credenciales de acceso:');
  console.log(`   Admin:       admin@avicola.com       / ${DEFAULT_SEED_PASSWORD}`);
  console.log(`   Contador:    contador@avicola.com    / ${DEFAULT_SEED_PASSWORD}`);
  console.log(`   Responsable: responsable@avicola.com / ${DEFAULT_SEED_PASSWORD}`);
  console.log(`   Galponero:   galponero@avicola.com   / ${DEFAULT_SEED_PASSWORD}`);
  console.log(`   Galponero 2: galponero2@avicola.com  / ${DEFAULT_SEED_PASSWORD}`);
  console.log(`   Auditor:     auditor@avicola.com     / ${DEFAULT_SEED_PASSWORD}`);
  console.log(`   Almacenista: almacenista@avicola.com  / ${DEFAULT_SEED_PASSWORD}`);
  console.log('\n🏭 12 Galpones (1A-6B) con ~25,000 gallinas cada uno');
  console.log('🥚 12 Tipos de huevo configurados (JUMBO a YEMAS)');
  console.log('📦 5 Clientes para despachos');
  console.log('💰 6 Categorías de costo con 14 conceptos');
  console.log('🏪 4 Silos de alimento');
  console.log('📊 Inventario de 7 días para testing');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });