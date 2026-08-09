# Avicola ERP - Sistema de Control de Produccion

Sistema web profesional para el control de produccion e inventarios de granja avicola industrial.

## Arquitectura

- **Frontend:** Next.js 14, React 18, TypeScript, TailwindCSS, Shadcn UI
- **Backend:** NestJS, TypeScript, Prisma ORM
- **Base de datos:** PostgreSQL
- **Almacenamiento:** MinIO (S3 compatible)
- **OCR:** Tesseract.js

## Instalacion

### 1. Docker
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd apps/backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### 3. Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

## Acceso

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger Docs: http://localhost:3001/api/docs
- MinIO Console: http://localhost:9001

## Credenciales de prueba

| Usuario | Email | Contrasena | Rol |
|---------|-------|------------|-----|
| Admin | admin@avicola.com | password123 | Administrador |
| Contador | contador@avicola.com | password123 | Contador |
| Responsable | responsable@avicola.com | password123 | Responsable Produccion |
| Galponero | galponero@avicola.com | password123 | Galponero |
| Auditor | auditor@avicola.com | password123 | Auditor |
| Almacenista | almacenista@avicola.com | password123 | Almacenista |

## Modulos

1. **Login** - Autenticacion JWT con roles
2. **Dashboard** - KPIs, graficos y alertas
3. **Galpones** - CRUD completo
4. **Captura Manual** - Formulario igual al formato fisico
5. **OCR** - Reconocimiento de imagenes del formato
6. **Importacion Excel** - Lectura automatica de archivos
7. **Motor de Comparacion** - Comparacion campo por campo
8. **Inventarios** - Gallinas, Huevos, Alimento, Bandejas (Kardex)
9. **Conciliacion** - Generacion automatica diaria
10. **Reportes** - Diarios, semanales, mensuales, anuales
11. **Auditoria** - Registro completo de acciones
12. **IA** - Preparado para OpenAI Vision / Google Vision
