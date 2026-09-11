# Documentación del proyecto Resources App

## 1. Resumen general

Este proyecto es una aplicación web de gestión de recursos humanos y asistencia, construida con Next.js 16, React 19 y MySQL. Su propósito principal es administrar:

- usuarios y roles
- colaboradores / empleados
- asistencia y ausencias
- solicitudes de permisos y novedades
- reportes y dashboard
- validaciones de aprobadores y RRHH

La aplicación usa el patrón App Router de Next.js y separa claramente:

- capa de presentación: componentes y páginas (`src/app`, `src/components`)
- capa de negocio: servicios (`src/services`)
- acceso a datos: repositorios (`src/lib/repositories`)
- conexiones a BD: `src/lib/db`
- autenticación y permisos: `src/context`, `src/lib/auth`, `src/middleware`

## Índice

1. [Resumen general](#1-resumen-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Requisitos previos](#3-requisitos-previos)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Instalación y arranque](#5-instalación-y-arranque)
6. [Scripts disponibles](#6-scripts-disponibles)
7. [Estructura de carpetas](#7-estructura-de-carpetas)
8. [Arquitectura general](#8-arquitectura-general)
9. [Flujo principal de autenticación](#9-flujo-principal-de-autenticación)
10. [API y manejo de respuestas](#10-api-y-manejo-de-respuestas)
11. [Rutas API más importantes](#11-rutas-api-más-importantes)
12. [Bases de datos y migraciones](#12-bases-de-datos-y-migraciones)
13. [Módulos funcionales principales](#13-módulos-funcionales-principales)
14. [Reportes automáticos](#14-reportes-automáticos)
15. [Patrones de diseño que usa la app](#15-patrones-de-diseño-que-usa-la-app)
16. [Puntos críticos / mejores prácticas para desarrolladores](#16-puntos-críticos--mejores-prácticas-para-desarrolladores)
17. [Posibles daños, errores e impactos](#17-posibles-daños-errores-e-impactos)
18. [Guía de diagnóstico y solución](#18-guía-de-diagnóstico-y-solución)
19. [Seguridad, respaldo y recuperación](#19-seguridad-respaldo-y-recuperación)
20. [Recomendaciones para extender la app](#20-recomendaciones-para-extender-la-app)
21. [Resumen ejecutivo](#21-resumen-ejecutivo)
22. [Comandos útiles rápidos](#22-comandos-útiles-rápidos)
23. [Repositorio de GitHub](#23-repositorio-de-github)
24. [Fin del documento](#24-fin-del-documento)

---

## 2. Stack tecnológico

### Frontend
- Next.js 16
- React 19
- CSS Modules y estilos globales
- Font Awesome + Lucide React para iconografía

### Backend / API
- Next.js API Routes (`src/app/api/.../route.js`)
- MySQL con `mysql2/promise`
- Servicios con lógica de negocio y validaciones

### Utilidades - !importante
- ExcelJS, XLSX para exportación
- jsPDF, html2canvas, pdfkit, puppeteer-core para reportes PDF
- nodemailer para envío de correos
- node-cron para tareas programadas
- date-fns para manejo de fechas
- sweetalert2 para alertas UI
- framer-motion para animaciones

### Herramientas de desarrollo
- ESLint
- Next.js build / start

---

## 3. Requisitos previos

Se recomienda:

- Node.js compatible con Next 16 (idealmente 20.x o superior)
- npm o pnpm/yarn
- MySQL disponible local o remoto
- acceso a una base de datos con las tablas relacionadas al módulo de RRHH y usuarios

---

## 4. Variables de entorno

El proyecto lee variables de entorno desde `process.env.*`.

### Configuración de base de datos
Archivos relevantes:
- `src/config/database.js`

Variables esperadas:

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=thirdpartydb

ATTLOG_DB_HOST=127.0.0.1
ATTLOG_DB_PORT=3306
ATTLOG_DB_USER=root
ATTLOG_DB_PASSWORD=
ATTLOG_DB_NAME=thirdpartydb
```

### Otras variables
```bash
JWT_SECRET=development-secret
MAIL_PROVIDER=smtp
MAIL_FROM=no-reply@example.com
NODE_ENV=development
```

> No existe un `.env.example` en la raíz, por lo que si el proyecto requiere variables locales, conviene crear un `.env.local` con estas claves antes de correr la app.

---

## 5. Instalación y arranque

### 1) Instalar dependencias

```bash
npm install
```

### 2) Ejecutar en modo desarrollo

```bash
npm run dev
```

La app normalmente queda disponible en:

```text
http://localhost:3000
```

### 3) Compilar para producción

```bash
npm run build
npm run start
```

### 4) Lint

```bash
npm run lint
```

---

## 6. Scripts disponibles

En `package.json` existen estos scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "reports:send": "node scripts/reports/send.js",
    "reports:send:date": "node scripts/reports/send.js",
    "reports:schedule": "node scripts/reports/scheduler.js"
  }
}
```

### Descripción de scripts
- `npm run dev`: arrancar entorno de desarrollo
- `npm run build`: compilación para producción
- `npm run start`: iniciar build compilada
- `npm run lint`: validar estilo y reglas de ESLint
- `npm run reports:send`: ejecutar envío de reportes
- `npm run reports:schedule`: programar ejecución automática de reportes

---

## 7. Estructura de carpetas

La estructura que sigue refleja el estado actual del proyecto luego de limpiar carpetas vacías sin tocar la lógica de la aplicación.

```text
resources_app/
├── AGENTS.md
├── CLAUDE.md
├── document.md
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package.json
├── README.md
├── db/
│   └── migrations/
├── docs/
│   ├── INSTALACION-REPORTES.md
│   ├── ORGANIZACION-REPORTES.md
│   ├── QUICKSTART-REPORTES.md
│   └── REPORTES.md
├── public/
│   └── icons/
├── reports/
├── scripts/
│   └── reports/
│       ├── README.md
│       ├── config.js
│       ├── scheduler.js
│       ├── send-report.bat
│       ├── send.js
│       └── lib/
│           ├── database.js
│           ├── email-service.js
│           ├── excel-generator.js
│           ├── pdf-generator-old.js
│           └── pdf-generator.js
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   ├── globals.css
│   │   ├── layout.jsx
│   │   ├── loading/
│   │   ├── login/
│   │   ├── page.js
│   │   ├── page.module.css
│   │   └── registrar-novedad/
│   ├── components/
│   │   ├── attendance/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   ├── timeline/
│   │   └── ui/
│   ├── config/
│   │   ├── app.js
│   │   ├── database.js
│   │   ├── mail.js
│   │   └── security.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── NotificationContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── UserContext.jsx
│   ├── hooks/
│   │   ├── useAttendance.js
│   │   ├── useAuth.js
│   │   ├── useDashboard.js
│   │   ├── useEmployees.js
│   │   └── useReports.js
│   ├── lib/
│   │   ├── auth/
│   │   ├── constants/
│   │   ├── db/
│   │   ├── errors/
│   │   ├── export.js
│   │   ├── repositories/
│   │   ├── security/
│   │   └── utils/
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── permissionMiddleware.js
│   │   └── roleMiddleware.js
│   ├── services/
│   │   ├── admin/
│   │   ├── approvals/
│   │   ├── attendance/
│   │   ├── auth/
│   │   ├── collaborators/
│   │   ├── dashboard/
│   │   ├── email/
│   │   ├── employees/
│   │   ├── leave-requests/
│   │   ├── reports/
│   │   ├── roles/
│   │   └── users/
│   └── styles/
│       ├── animations.css
│       ├── theme.css
│       ├── utilities.css
│       └── variables.css
└──
```

> Las carpetas `templates/`, `public/images/`, `src/lib/helpers/` y `src/lib/validations/` fueron eliminadas porque estaban vacías y no forman parte de la lógica funcional del proyecto.

---

## 8. Arquitectura general

### 8.1 Organización por capas

#### 1) Páginas y rutas (`src/app`)
Las páginas del sistema viven bajo App Router. Aquí están las vistas principales y también las rutas de API:

- `/login`: autenticación
- `/dashboard`: panel principal
- `/attendance`: asistencia y dispositivos
- `/summary`: resumen diario
- `/absent`: ausentes
- `/leave-requests`: novedades / validaciones
- `/users`: cuentas de usuarios
- `/collaborators`: colaboradores
- `/absence/manage`: administración de ausencias

Además existe lógica de API en:

- `/api/auth/login`
- `/api/admin/...`
- `/api/employees/...`
- `/api/summary`
- `/api/leave-requests`
- `/api/attlog`

#### 2) Componentes (`src/components`)
Aquí están los componentes visuales reutilizables, típicamente agrupados por dominio:

- `attendance/`: filtros y vistas de asistencia
- `dashboard/`: cards y insights del panel
- `reports/`: reportes visuales
- `timeline/`: cronogramas y flujos de tiempo
- `ui/`: layout general, loaders, navegación

#### 3) Context y estado global (`src/context`)
El estado de sesión se maneja con contextos:

- `AuthContext.jsx`: guarda el usuario autenticado, login/logout, lectura de `localStorage`
- `UserContext.jsx`, `ThemeContext.jsx`, `NotificationContext.jsx`: preparación para flujo de UI y contexto general

#### 4) Hooks (`src/hooks`)
Los hooks encapsulan la lógica de presentación y acceso a datos del frontend, por ejemplo:

- `useAuth.js`
- `useAttendance.js`
- `useDashboard.js`
- `useEmployees.js`
- `useReports.js`

#### 5) Servicios (`src/services`)
La lógica de negocio se concentra aquí.

Ejemplo de archivos importantes:
- `src/services/auth/auth.service.js`: login / registro / validación
- `src/services/leave-requests/leave-request.service.js`: estado, revisión, aprobación y rechazo
- `src/services/employees/employee.service.js`: lógica de colaboradores
- `src/services/dashboard/dashboard.service.js`: métricas del dashboard
- `src/services/reports/report.service.js`: reportes

#### 6) Repositorios (`src/lib/repositories`)
Los repositorios encapsulan consultas SQL para entidades concretas:

- `user.repository.js`
- `employee.repository.js`
- `department.repository.js`
- `position.repository.js`
- `leave-request.repository.js`
- `summary.repository.js`
- `attlog.repository.js`

Esta separación ayuda a mantener la lógica de SQL fuera del controlador y del componente.

#### 7) Base de datos (`src/lib/db`)
Aquí se define la conexión de MySQL y utilidades de query:

- `mysql.js`: creación del pool principal y del pool de attlog
- `connection.js`: configuración de conexión
- `queries.js`: lista/centralización de consultas
- `transaction.js`: utilidades transaccionales

---

## 9. Flujo principal de autenticación

### 9.1 Login

El flujo actual empieza en la vista de login:

- archivo: `src/app/login/page.jsx`
- realiza `fetch('/api/auth/login')`
- envía email y password
- si el login es correcto, llama a `login(payload.data)` del `AuthContext`
- guarda el usuario en `localStorage` con clave `authUser`
- redirige a `/loading?next=/dashboard`

### 9.2 AuthContext

Archivo: `src/context/AuthContext.jsx`

Este provider:

- inicializa `user` con `undefined`
- en `useEffect`, intenta leer `authUser` desde `localStorage`
- expone `login()`, `logout()`, `hydrated`
- arma el estado global para toda la app

### 9.3 Layout principal

Archivo: `src/components/ui/layout/AppLayout.jsx`

Este componente:

- renderiza la shell de navegación
- verifica el rol del usuario
- muestra menú según permisos
- calcula el título de la página actual
- permite logout
- redirige usuarios HR o supervisor según reglas configuradas

---

## 10. API y manejo de respuestas

### Utilidades de respuesta
Archivo: `src/lib/utils/api-response.js`

Se usan dos helpers:

```js
okResponse(data, meta)
errorResponse(message, status)
```

Esto ayuda a estandarizar las respuestas JSON:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

y

```json
{
  "success": false,
  "error": "mensaje",
  "status": 400
}
```

### Manejo de errores
Archivo: `src/lib/errors/AppError.js`

Define una clase de error personalizada con:

- `message`
- `status`
- `name = 'AppError'`

Esto permite manejar errores de negocio de una forma consistente en rutas de API.

---

## 11. Rutas API más importantes

### Auth
- `/api/auth/login`: inicio de sesión
- `/api/auth/register`: creación de usuarios

### Admin
- `/api/admin/absences`: gestión de ausencias
- `/api/admin/collaborator-documents`: documentos del colaborador
- `/api/admin/departments`: departamentos
- `/api/admin/employees`: empleados
- `/api/admin/leave-requests`: novedades y aprobaciones
- `/api/admin/leader-employees`: relación líderes-empleados
- `/api/admin/positions`: cargos
- `/api/admin/roles`: roles

### General
- `/api/employees`: listado y alta de empleados
- `/api/employees/validate`: validación de empleado
- `/api/summary`: resumen general
- `/api/attlog`: registros de dispositivos de asistencia
- `/api/leave-requests/public`: creación pública de novedades
- `/api/users`: gestión de cuentas
- `/api/health`: estado del sistema

---

## 12. Bases de datos y migraciones

La carpeta `db/migrations` contiene las migraciones SQL del proyecto.

Ejemplos:

- `002_add_active_to_users.sql`
- `003_add_user_statuses.sql`
- `004_add_employee_roles.sql`
- `005_add_leader_role.sql`
- `006_add_leave_request_attachment_and_leader.sql`
- `007_add_leave_request_details.sql`
- `008_add_leave_request_total_hours.sql`
- `009_complete_leave_request_form.sql`
- `010_add_leave_request_leader_fk.sql`
- `011_create_leave_request_states.sql`
- `012_add_leave_request_review_fields.sql`
- `013_link_employees_to_users.sql`
- `014_add_absence_hours.sql`

Esto indica que la aplicación tiene evolución del esquema y manejo de estados de usuarios, solicitudes, empleados y permisos.

---

## 13. Módulos funcionales principales

### 13.1 Gestión de usuarios y roles
- usuarios
- estados activos/inactivos
- roles
- vinculación usuario-empleado

### 13.2 Dashboard y resumen
- métricas de asistencia
- ausencia, novedad y reportes
- panel para supervisores, RRHH y administración

### 13.3 Asistencia / attlog
- lectura de registros de dispositivos de asistencia
- consultas SQL relacionadas con `attlog` y registros horarios

### 13.4 Novedades / permisos
- `leave requests`
- aprobación por líder o RRHH
- estados de revisión
- comentarios de validación

### 13.5 Colaboradores / empleados
- alta, actualización, vinculación con usuarios
- administración de cargos y departamento

### 13.6 Reportes
- generación de archivos Excel/PDF
- envío de reportes por correo
- cron jobs para reportes automáticos

---

## 14. Reportes automáticos

La carpeta `scripts/reports` implementa automatización de reportes.

### Archivos clave
- `scripts/reports/send.js`: genera y envía reportes
- `scripts/reports/scheduler.js`: agenda tareas
- `scripts/reports/config.js`: configuración de BD y mail
- `scripts/reports/lib/database.js`: acceso a datos
- `scripts/reports/lib/excel-generator.js`: generación de Excel
- `scripts/reports/lib/pdf-generator.js`: generación de PDF
- `scripts/reports/lib/email-service.js`: envío de correos

### Documentación específica
- `docs/REPORTES.md`
- `docs/INSTALACION-REPORTES.md`
- `docs/QUICKSTART-REPORTES.md`
- `docs/ORGANIZACION-REPORTES.md`

---

## 15. Patrones de diseño que usa la app

### 15.1 Separación por capas
La lógica no está mezclada en componentes. Se busca esta estructura:

- UI -> `src/app` / `src/components`
- negocio -> `src/services`
- consultas -> `src/lib/repositories`
- conexión -> `src/lib/db`

### 15.2 Estandarización de respuestas
Todas las API devuelven una estructura uniforme con `success`, `data` y `error`/`status` cuando falla.

### 15.3 Errores de dominio
Se usa `AppError` para comunicar errores esperados con el estado HTTP apropiado.

### 15.4 Contextos para estado global
La sesión y el usuario viven en `AuthContext` para evitar prop drilling.

---

## 16. Puntos críticos / mejores prácticas para desarrolladores

### Antes de trabajar en la app
1. Revisar `.env.local` y asegurar conexión a MySQL.
2. Verificar que la base tenga las migraciones aplicadas.
3. Confirmar que el usuario autenticado tenga permisos según el rol.
4. Revisar rutas bajo `src/app/api` antes de tocar servicios.

### Cuándo modificar cada capa
- `src/app`: cambio de pantalla o ruta
- `src/components`: UI y presentación
- `src/services`: lógica funcional / validación
- `src/lib/repositories`: consultas SQL
- `src/config`: variables globales del proyecto
- `src/context`: estado global y sesión

### Consideraciones importantes
- La autenticación usa `localStorage` para persistir el usuario autenticado.
- La mayor parte del sistema está pensado para trabajar con MySQL y varias tablas de RRHH.
- Hay una separación entre base normal y base de “attlog” de asistencia.
- El proyecto incluye tareas automáticas de reportes y scripts para envío por correo.

---

### 16.1 Flujo recomendado para investigar un fallo

Cuando aparezca un problema, no conviene modificar varias capas al mismo tiempo. Se recomienda seguir este orden:

1. Registrar fecha, hora, usuario afectado, pantalla, acción realizada y mensaje exacto.
2. Reproducir el problema con los mismos datos, sin usar información real innecesaria.
3. Revisar la consola del navegador y la solicitud HTTP en la pestaña Network.
4. Revisar la terminal de Next.js y buscar el error original, no solo el mensaje visual.
5. Determinar si el fallo está en la interfaz, API, servicio, repositorio o base de datos.
6. Corregir la capa responsable y ejecutar `npm run lint` y `npm run build` antes de publicar.
7. Probar el caso correcto, el caso inválido y el caso de permisos insuficientes.

La interfaz puede mostrar un mensaje entendible, pero la causa técnica debe conservarse en los logs sin exponer contraseñas, tokens ni datos personales.

## 17. Posibles daños, errores e impactos

Esta sección funciona como una matriz preventiva. Un “daño” es el impacto que tendría una configuración incorrecta, un cambio sin validar o una indisponibilidad del sistema.

### 17.1 Instalación y dependencias

**Síntoma:** aparece `Module not found`, una dependencia no se puede importar o Next.js no inicia.

**Causas:** no se ejecutó `npm install`, el lockfile está desactualizado o la versión de Node.js no es compatible.

**Impacto:** la aplicación no arranca, no se generan reportes y el equipo queda sin acceso.

**Solución:** comprobar `node --version`, ejecutar `npm install`, verificar que `package.json` y el lockfile estén sincronizados y repetir `npm run dev`. Las dependencias nuevas deben quedar registradas en `package.json`.

### 17.2 Conexión con MySQL

**Síntoma:** `Can't connect to database`, tiempos de espera, errores de autenticación o pantallas sin datos.

**Causas:** MySQL detenido, host o puerto incorrectos, usuario sin permisos, base inexistente o `.env.local` no cargado.

**Impacto:** no se puede iniciar sesión, consultar colaboradores, leer asistencia ni aprobar solicitudes. Una escritura puede quedar incompleta si no usa transacciones.

**Solución:** verificar el servicio MySQL y las credenciales, revisar `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`, y confirmar las variables `ATTLOG_*` para asistencia. Después de cambiar variables, reiniciar el servidor.

### 17.3 Migraciones incompletas

**Síntoma:** una columna no existe, falla una clave foránea o una consulta funciona en una máquina y en otra no.

**Causas:** migraciones de `db/migrations` ejecutadas fuera de orden o esquema desactualizado.

**Impacto:** pueden fallar roles, estados de solicitudes, archivos adjuntos, horas de ausencia y vínculos entre usuarios y empleados.

**Solución:** hacer respaldo, revisar qué migraciones faltan, ejecutarlas en orden y verificar las tablas y columnas resultantes. No eliminar estructuras en producción sin confirmar dependencias y plan de restauración.

### 17.4 Autenticación y sesión

**Síntoma:** el login rechaza credenciales válidas, redirige continuamente o el menú no corresponde al usuario.

**Causas:** usuario inactivo, datos antiguos en `localStorage`, respuesta de login diferente a la esperada o cambios en `AuthContext`.

**Impacto:** bloqueo de usuarios o acceso visual a opciones incorrectas. Si la API no valida permisos, puede existir modificación no autorizada de información.

**Solución:** comprobar el estado del usuario, limpiar solo `authUser` para descartar una sesión obsoleta, revisar `/api/auth/login` y validar permisos en middleware y API. Ocultar un botón no reemplaza la autorización del servidor.

### 17.5 Roles y permisos

**Síntoma:** un supervisor ve otro departamento, un líder no puede aprobar o un usuario obtiene una opción administrativa.

**Causas:** rol incorrecto, relación líder-empleado incompleta, filtro ausente o validación solo en frontend.

**Impacto:** divulgación de datos laborales, aprobación indebida o modificación de información sensible.

**Solución:** revisar usuario, rol, estado y relaciones; comprobar `authMiddleware`, `permissionMiddleware` y `roleMiddleware`; probar con un usuario de cada rol y verificar respuestas `401` y `403`.

### 17.6 Asistencia ausente o incorrecta

**Síntoma:** faltan entradas o salidas, los horarios aparecen desplazados o el reporte tiene cantidades inesperadas.

**Causas:** base `attlog` equivocada, zona horaria diferente, registros duplicados, reloj del dispositivo desconfigurado o empleado sin identificador vinculado.

**Impacto:** reportes laborales incorrectos y decisiones administrativas basadas en datos incompletos.

**Solución:** comparar hora del dispositivo y servidor, confirmar `ATTLOG_DB_*`, revisar el identificador del empleado y consultar los registros originales. Antes de corregir, guardar evidencia y autorización.

### 17.7 Solicitudes de permisos y novedades

**Síntoma:** una solicitud no cambia de estado, no llega al líder, se aprueba dos veces o desaparece un adjunto.

**Causas:** transición inválida, aprobador sin relación, doble envío, archivo no guardado o actualización parcial.

**Impacto:** pérdida de trazabilidad, aprobación errónea y conflictos entre RRHH y usuarios.

**Solución:** revisar estado e historial, validar autorización en el servicio, impedir transiciones duplicadas y usar transacciones para solicitud, historial y archivo. Validar tamaño, extensión y ubicación de cada adjunto.

### 17.8 Reportes PDF y Excel

**Síntoma:** archivo vacío, empleados duplicados, departamentos desordenados, horas incorrectas o archivo no generado.

**Causas:** consulta sin datos, fecha mal formateada, columnas cambiadas, colaborador sin departamento, error del generador o falta de permisos en `reports/`.

**Impacto:** envío de información incompleta a gerencia y necesidad de reprocesar la jornada.

**Solución:** generar una fecha conocida, comprobar la cantidad de registros recuperados, comparar PDF y Excel, revisar permisos de escritura y conservar el archivo original. Los registros sin departamento deben quedar en `Sin departamento`.

### 17.9 Correo y tareas programadas

**Síntoma:** el reporte se genera pero no llega, llega sin adjuntos o el scheduler no ejecuta la tarea.

**Causas:** SMTP inaccesible, contraseña de aplicación inválida, destinatario incorrecto, zona horaria del cron, proceso detenido o permisos insuficientes.

**Impacto:** los responsables trabajan con información desactualizada.

**Solución:** separar la prueba de generación de la prueba de envío, revisar `scripts/reports/config.js`, comprobar el puerto SMTP, ejecutar `node scripts/reports/send.js YYYY-MM-DD` manualmente y revisar los logs. Controlar reintentos para no enviar duplicados.

### 17.10 Exposición de datos o credenciales

**Síntoma:** contraseñas en archivos versionados, reportes públicos, tokens en logs o endpoints administrativos sin autorización.

**Causas:** secretos escritos en código, carpetas expuestas, validación solo en cliente o logs demasiado detallados.

**Impacto:** acceso no autorizado a información laboral, correo, base de datos y documentos.

**Solución:** revocar secretos expuestos, usar variables de entorno, restringir `reports/` y `storage/uploads/`, revisar el historial de Git y proteger cada endpoint. Los archivos subidos deben descargarse mediante una ruta autorizada.

## 18. Guía de diagnóstico y solución

### 18.1 La aplicación no abre

1. Ejecutar `node --version` y comprobar compatibilidad con Next.js 16.
2. Ejecutar `npm install` y luego `npm run lint`.
3. Revisar el primer error de la terminal; los siguientes pueden ser consecuencias.
4. Corregir el archivo indicado y repetir `npm run build`.

### 18.2 La página carga, pero no muestra datos

1. Revisar la solicitud en Network.
2. Interpretar `401` como sesión, `403` como permiso, `404` como ruta y `500` como error del servidor.
3. Revisar el JSON, que usa `success`, `data`, `error` y `status`.
4. Para `500`, revisar terminal y MySQL antes de modificar el componente visual.

### 18.3 Se guardan datos parciales

Cuando una operación modifica varias tablas y una consulta falla, se debe usar una transacción: iniciar, validar, confirmar con `COMMIT` y revertir con `ROLLBACK`. La interfaz no debe indicar éxito si solo se guardó una parte.

### 18.4 Corrección manual en producción

1. Confirmar identificador, motivo y autorización.
2. Respaldar el registro original.
3. Revisar relaciones, historial y auditoría.
4. Ejecutar una consulta limitada por identificador; nunca un `UPDATE` sin `WHERE`.
5. Confirmar el resultado y documentar responsable y fecha.

### 18.5 Cierre de un incidente

- Se identificó la causa y no solo el síntoma.
- Se verificó que no hubiera pérdida o exposición de datos.
- Se probó un caso válido, uno inválido y uno sin permisos.
- Se ejecutaron `npm run lint` y `npm run build` si hubo cambios de código.
- Se registró la solución y una medida para evitar recurrencia.

## 19. Seguridad, respaldo y recuperación

### 19.1 Protección de credenciales

- No publicar `.env.local`, contraseñas SMTP, secretos JWT ni credenciales MySQL.
- Usar una cuenta de base de datos con permisos mínimos; evitar `root` en producción.
- Cambiar cualquier credencial expuesta en repositorio, captura o log.
- No imprimir contraseñas ni tokens en errores.

### 19.2 Protección de archivos

- Restringir acceso a `reports/` y `storage/uploads/`.
- Validar extensión, tamaño y tipo real de archivos.
- Evitar nombres predecibles para documentos sensibles.
- Mantener trazabilidad de aprobaciones, rechazos, correcciones y descargas.

### 19.3 Respaldo mínimo

El respaldo debe incluir base de datos, configuración segura, `storage/uploads/` y reportes que deban conservarse. Se debe probar periódicamente la restauración, porque un respaldo nunca restaurado no garantiza recuperación. Registrar fecha, responsable, ubicación, período cubierto y resultado de la verificación.

### 19.4 Recuperación ante caída

1. Identificar si la caída corresponde a la app, MySQL, red o SMTP.
2. Detener procesos automáticos que puedan duplicar escrituras o correos.
3. Restaurar base de datos y archivos respetando la versión del esquema.
4. Probar login, permisos, asistencia, solicitudes y reportes.
5. Reactivar el scheduler solo cuando no vaya a enviar duplicados.
6. Registrar duración, impacto, solución y acción preventiva.

## 20. Recomendaciones para extender la app

### Si se agrega una nueva entidad
1. Crear servicio en `src/services/<modulo>/`
2. Crear repositorio en `src/lib/repositories/`
3. Crear API route en `src/app/api/<modulo>/route.js`
4. Crear vista o componente en `src/app/(dashboard)/<modulo>/`
5. Si aplica, definir permisos o roles asociados

### Si se cambia la lógica de autenticación
- revisar `src/context/AuthContext.jsx`
- revisar `src/services/auth/auth.service.js`
- revisar `src/app/api/auth/login/route.js`

### Si se modifica la navegación
- revisar `src/components/ui/layout/AppLayout.jsx`
- actualizar `navItems` y filtros por rol

---

## 21. Resumen ejecutivo

La aplicación es un sistema interno de RRHH / asistencia basado en Next.js con arquitectura modular, separación de responsabilidades y acceso a MySQL. Tiene un flujo bien definido de autenticación, navegación por roles, gestión de empleados y solicitudes, y un módulo de reportes automatizados.

Para un nuevo programador, la ruta de entrada recomendada es:

1. revisar `package.json`
2. revisar `src/config/database.js`
3. revisar `src/app/layout.jsx`
4. revisar `src/context/AuthContext.jsx`
5. revisar `src/app/api/auth/login/route.js`
6. revisar `src/services/auth/auth.service.js`
7. revisar una ruta funcional ejemplo (dashboard, users, leave-requests)

Con eso se comprende el flujo completo de la app.

---

## 22. Comandos útiles rápidos

```bash
npm install
npm run dev
npm run build
npm run lint
npm run reports:send
npm run reports:schedule
```

---

## 23. Repositorio de GitHub

- AcemaIngenieria2022
- Acema2026.s

## 24. Fin del documento

