# GUIA DE USO - SISTEMA AVICOLA ERP
## Para la Contadora / Auditora

---

## INDICE

1. [Que es este sistema](#1-que-es-este-sistema)
2. [Como entrar al sistema](#2-como-entrar-al-sistema)
3. [Vista general del dashboard](#3-vista-general-del-dashboard)
4. [Flujo de trabajo diario](#4-flujo-de-trabajo-diario)
5. [Modulo OCR - Reconocimiento de imagenes](#5-modulo-ocr---reconocimiento-de-imagenes)
6. [Modulo de Importacion Excel](#6-modulo-de-importacion-excel)
7. [Motor de Comparacion](#7-motor-de-comparacion)
8. [Conciliacion Contable](#8-conciliacion-contable)
9. [Inventarios](#9-inventarios)
10. [Reportes](#10-reportes)
11. [Auditoria](#11-auditoria)
12. [Preguntas frecuentes](#12-preguntas-frecuentes)

---

## 1. QUE ES ESTE SISTEMA

El **Avicola ERP** es un sistema web que automatiza el control de producción e inventarios de la granja avicola.

### Que hace por usted:

- **Automatiza la comparacion** entre el formato en papel del galponero y el Excel del responsable
- **Detecta errores automaticamente** antes del cierre contable
- **Genera conciliaciones** con colores que indican si hay diferencias
- **Respalda toda la informacion** de forma segura en la nube
- **Genera reportes** diarios, semanales y mensuales

### Flujo simplificado:

```
Galponero llena formato en papel
         ↓
Responsable transcribe a Excel
         ↓
Usted carga la imagen del formato (OCR)
         ↓
Usted carga el Excel del responsable
         ↓
EL SISTEMA COMPARA AUTOMATICAMENTE
         ↓
Se muestran las diferencias con colores:
   🟢 Verde = Todo correcto
   🟡 Amarillo = Revisar
   🔴 Rojo = Error detectado
         ↓
Usted aprueba o rechaza la conciliacion
```

---

## 2. COMO ENTRAR AL SISTEMA

### Paso 1: Abrir el navegador
- Use Google Chrome, Microsoft Edge o Firefox
- Escriba la direccion: `http://localhost:3000`

### Paso 2: Iniciar sesion
- Escriba su correo electronico
- Escriba su contrasena
- Haga clic en "Iniciar Sesion"

### Credenciales de prueba:

| Usuario | Correo | Contrasena | Rol |
|---------|--------|------------|-----|
| Contador | contador@avicola.com | password123 | Contador |
| Admin | admin@avicola.com | password123 | Administrador |
| Auditor | auditor@avicola.com | password123 | Auditor |

---

## 3. VISTA GENERAL DEL DASHBOARD

Al entrar, vera el **Dashboard** con la informacion mas importante:

### Tarjetas superiores:

| Tarjeta | Que muestra |
|---------|-------------|
| **Produccion Hoy** | Total de huevos producidos hoy |
| **Gallinas Vivas** | Total de gallinas en todos los galpones |
| **Porcentaje Postura** | % de gallinas que estan poniendo |
| **Mortalidad** | Gallinas muertas hoy |

### Secciones adicionales:

- **Inventario Alimento** - Cuanto alimento queda
- **Comparaciones Hoy** - Cuantas comparaciones se hicieron
- **Alertas** - Avisos importantes que necesita revisar
- **Resumen Mensual** - Produccion y mortalidad del mes

### Colores de las alertas:

- 🟢 **Verde** = Todo funciona bien
- 🟡 **Amarillo** = Algo necesita atencion
- 🔴 **Rojo** = Hay un problema que debe revisarse

---

## 4. FLUJO DE TRABAJO DIARIO

### Paso 1: Capturar los datos del galponero

Opcion A - **Captura Manual:**
1. Vaya a "Captura Manual" en el menu lateral
2. Seleccione la fecha de hoy
3. Llene los datos de cada galpón (mortalidad, produccion, alimento)
4. Llene la produccion por tipo de huevo (Jumbo, Extra, AA, A, B, etc.)
5. Haga clic en "Guardar Reporte"

Opcion B - **OCR (Recomendado):**
1. Tome una foto al formato del galponero con su celular
2. Vaya a "OCR - Imagen" en el menu
3. Cargue la foto
4. El sistema extrae los datos automaticamente
5. Revise y corrija si es necesario
6. Guarde

### Paso 2: Importar el Excel del responsable

1. Vaya a "Importar Excel" en el menu
2. Seleccione el archivo .xlsx del responsable
3. Haga clic en "Importar Datos"
4. Revise los datos detectados

### Paso 3: Ejecutar la comparacion

1. Vaya a "Comparacion" en el menu
2. Seleccione el reporte OCR/Manual
3. Seleccione el reporte Excel
4. Haga clic en "Ejecutar Comparacion"
5. **Revise los resultados:**
   - Campos en 🟢 verde = Correctos
   - Campos en 🟡 amarillo = Revisar
   - Campos en 🔴 rojo = Error (hay diferencia)

### Paso 4: Generar conciliacion

1. Vaya a "Conciliacion" en el menu
2. Seleccione la fecha
3. Haga clic en "Generar Conciliacion"
4. Revise la tabla comparativa
5. Haga clic en "Aprobar" si todo esta correcto
6. O "Rechazar" si hay problemas

---

## 5. MODULO OCR - RECONOCIMIENTO DE IMAGENES

### Que es OCR?
OCR significa **Reconocimiento Optico de Caracteres**. El sistema "lee" la imagen del formato y extrae los datos automaticamente.

### Como usarlo:

1. **Tome la foto:**
   - Use la camara de su celular
   - Asegurese de que el formato este bien iluminado
   - Que todos los numeros sean legibles
   - Enfoque bien la imagen

2. **Cargue la imagen:**
   - Vaya a "OCR - Imagen"
   - Haga clic en el area de carga
   - Seleccione la foto

3. **Procese:**
   - Haga clic en "Procesar Imagen"
   - Espere unos segundos

4. **Revise los resultados:**
   - El sistema muestra la fecha detectada
   - Muestra los galpones con sus datos
   - Muestra el texto original que detecto

5. **Corrija si es necesario:**
   - Si un numero esta mal, corrijalo
   - Si falta algun dato, agreguelo

6. **Guarde:**
   - Haga clic en "Guardar en Base de Datos"

### Formatos aceptados:
- JPG
- PNG
- HEIC (iPhone)

---

## 6. MODULO DE IMPORTACION EXCEL

### Que hace?
Lee automaticamente el archivo Excel que prepara el responsable de produccion.

### Como usarlo:

1. Vaya a "Importar Excel"
2. Haga clic en el area de carga
3. Seleccione el archivo .xlsx
4. Haga clic en "Importar Datos"
5. Revise los datos detectados:
   - Galpones encontrados
   - Consumo de alimento
   - Produccion
   - Mortalidad

### Formatos aceptados:
- .xlsx
- .xls
- .csv

---

## 7. MOTOR DE COMPARACION

### Este es el modulo mas importante para usted.

### Que hace?
Compara **campo por campo** los datos del galponero (OCR/Manual) contra los datos del responsable (Excel).

### Como ejecutar una comparacion:

1. Vaya a "Comparacion"
2. Seleccione el **Reporte OCR/Manual** de la lista izquierda
3. Seleccione el **Reporte Excel** de la lista derecha
4. Haga clic en "Ejecutar Comparacion"

### Como leer los resultados:

| Columna | Significado |
|---------|-------------|
| **Galpon** | Cual galpón se esta comparando |
| **Campo** | Que dato se esta comparando (mortalidad, produccion, etc.) |
| **Valor OCR** | Lo que dice el formato del galponero |
| **Valor Excel** | Lo que dice el Excel del responsable |
| **Diferencia** | La diferencia numerica |
| **Estado** | Si esta bien o mal |

### Colores de estado:

- 🟢 **CORRECTO** = Los valores son iguales
- 🟡 **REVISAR** = Hay una diferencia pequena (menor a 100)
- 🔴 **ERROR** = Hay una diferencia grande (mayor a 100 o mayor al 5%)

### Ejemplo practico:

```
Galpon: 1A
Campo: Produccion
Valor OCR: 5,849
Valor Excel: 5,253
Diferencia: 596
Estado: 🔴 ERROR (diferencia > 100)
```

Esto significa que hay 596 huevos de diferencia entre el formato y el Excel. **Debe investigar cual de los dos esta mal.**

---

## 8. CONCILIACION CONTABLE

### Que es?
Es el resumen final que muestra todas las comparaciones del dia en una sola tabla.

### Como generarla:

1. Vaya a "Conciliacion"
2. Seleccione la fecha de hoy
3. Haga clic en "Generar Conciliacion"
4. Se genera automaticamente

### La tabla muestra:

| Columna | Que significa |
|---------|---------------|
| **Concepto** | Que se esta comparando |
| **Valor Imagen** | Lo que dice el formato |
| **Valor Excel** | Lo que dice el Excel |
| **Diferencia** | La diferencia |
| **Estado** | 🟢 🟡 🔴 |

### Que puede hacer:

- **Aprobar** si todo esta correcto
- **Rechazar** si hay problemas que resolver

### Estados:

- 🟢 **APROBADA** = Todo bien, firmada por el contador
- 🟡 **PENDIENTE** = Esperando revision
- 🔴 **RECHAZADA** = Hay problemas

---

## 9. INVENTARIOS

### Tipos de inventario:

1. **Gallinas** - Kardex por galpón (saldo inicial, entradas, mortalidad, ventas, saldo final)
2. **Huevos** - Control por tipo (Jumbo, Extra, AA, A, B, Revoltura, C, Pipo, Blanco, Sucio, Roto, Yemas)
3. **Alimento** - Control en Kg y bultos
4. **Bandejas** - Entradas, salidas y saldo

### Como usar:

1. Seleccione el galpón
2. Haga clic en la pestana del inventario que quiere ver
3. Vea el historial completo

---

## 10. REPORTES

### Tipos de reporte:

- **Diario** - Produccion de un solo dia
- **Semanal** - Resumen de una semana
- **Mensual** - Resumen de un mes

### Como exportar:

- **CSV** - Para abrir en Excel
- **PDF** - Para imprimir o enviar por correo

---

## 11. AUDITORIA

### Que es?
Registra **todas las acciones** que se hacen en el sistema.

### Que muestra:

- Quien hizo la accion
- Cuando la hizo (fecha y hora)
- Que hizo (crear, editar, eliminar, etc.)
- Desde que direccion IP

### Quien puede verla:
- Administrador
- Contador
- Auditor

---

## 12. PREGUNTAS FRECUENTES

### P: Que hago si el OCR no detecta bien los numeros?
**R:** Puede corregirlos manualmente antes de guardar. El OCR es una ayuda, pero usted siempre puede ajustar.

### P: Que hago si hay una diferencia grande en la comparacion?
**R:** 
1. Revise el formato original del galponero
2. Revise el Excel del responsable
3. Determine cual de los dos esta mal
4. Corrija el dato incorrecto
5. Vuelva a comparar

### P: Puedo aprobar una conciliacion con errores?
**R:** No se recomienda. Primero resuelva las diferencias y luego apruebe.

### P: Donde quedan guardados los archivos?
**R:** En el servidor seguro (MinIO). Las imagenes y archivos Excel quedan resguardados.

### P: Puedo ver quien cambio algo?
**R:** Si, vaya a "Auditoria" y vera el historial completo.

### P: Que pasa si cierro sesion sin guardar?
**R:** Los datos en curso se pierden. Siempre guarde antes de salir.

### P: El sistema funciona en el celular?
**R:** Si, es responsive. Puede acceder desde cualquier dispositivo con navegador.

---

## CONTACTO DE SOPORTE

Para soporte tecnico, contacte al administrador del sistema.

---

*Guia de uso v1.0 - Sistema Avicola ERP - 2026*
