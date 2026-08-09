# Guia de Despliegue - Avicola ERP

## Stack Gratuito
- **Frontend**: Vercel (gratis)
- **Backend**: Render (gratis)
- **Base de datos**: Neon PostgreSQL (gratis)

---

## Paso 1: Crear repositorio en GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU-USUARIO/avicola-erp.git
git push -u origin main
```

---

## Paso 2: Base de datos en Neon

1. Ve a https://console.neon.tech
2. Crea una cuenta gratuita
3. Crea un proyecto nuevo ( nombre: `avicola` )
4. Copia el **Connection string** (se ve asi):
   ```
   postgresql://avicola_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/avicola_produccion?sslmode=require
   ```
5. Guardalo, lo necesitaras despues

---

## Paso 3: Backend en Render

1. Ve a https://render.com y crea cuenta
2. **New +** -> **Web Service**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `avicola-backend`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free
5. En **Environment Variables** agrega:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | (el connection string de Neon) |
   | `JWT_SECRET` | (cualquier texto seguro, ej: `mi-secreto-super-seguro-2026`) |
   | `JWT_EXPIRATION` | `24h` |
   | `CORS_ORIGIN` | `https://TU-PROYECTO.vercel.app` |
   | `PORT` | `3001` |
   | `NODE_ENV` | `production` |

6. Click **Create Web Service**
7. Espera a que termine el build (~5-10 min)
8. Copia la URL que te da Render (ej: `https://avicola-backend.onrender.com`)

---

## Paso 4: Frontend en Vercel

1. Ve a https://vercel.com y crea cuenta
2. **Add New Project** -> Importa tu repositorio de GitHub
3. En **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. En **Environment Variables** agrega:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://TU-BACKEND.onrender.com/api/v1` |

5. Click **Deploy**
6. Espera ~2 min
7. Tu app estara en `https://TU-PROYECTO.vercel.app`

---

## Paso 5: Poblar la base de datos

Despues del primer deploy, necesitas crear los usuarios y galpones.

Opcion A: Usar Swagger
1. Ve a `https://TU-BACKEND.onrender.com/api/docs`
2. Hace login con `admin@avicola.com` / `password123`
3. Usa los endpoints para crear datos

Opcion B: Ejecutar seed localmente apuntando a Neon
```bash
cd apps/backend
DATABASE_URL="tu-connection-string-de-neon" npx prisma db seed
```

---

## Notas Importantes

### Render Free Tier
- El backend se "duerme" despues de 15 min sin trafico
- Al primera request toma ~30 seg en despertar
- Esto es normal en el tier gratis

### Archivos (OCR/Excel)
- En produccion sin MinIO, los archivos se guardan temporalmente en /uploads
- Para una solucion permanente, configurar AWS S3 o Cloudflare R2

### Variables de entorno en Vercel
- `NEXT_PUBLIC_API_URL` es la URL de tu backend en Render
- Ejemplo: `https://avicola-backend.onrender.com/api/v1`

### CORS
- En `CORS_ORIGIN` puedes poner multiples URLs separadas por coma
- Ejemplo: `https://avicola.vercel.app,http://localhost:3000`
