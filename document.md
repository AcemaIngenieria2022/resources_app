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

### Utilidades
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
│   └── images/
├── reports/
├── scripts/
│   └── reports/
│       ├── config.js
│       ├── README.md
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
│   │   ├── loading/
│   │   ├── login/
│   │   ├── registrar-novedad/
│   │   ├── globals.css
│   │   ├── layout.jsx
│   │   ├── page.js
│   │   └── page.module.css
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
│   │   ├── helpers/
│   │   ├── repositories/
│   │   ├── security/
│   │   ├── utils/
│   │   └── validations/
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
└── templates/
```

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

## 17. Recomendaciones para extender la app

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

## 18. Resumen ejecutivo

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

## 19. Comandos útiles rápidos

```bash
npm install
npm run dev
npm run build
npm run lint
npm run reports:send
npm run reports:schedule
```

---

## 20. Nota final

Este documento fue pensado como guía de onboarding para otro desarrollador. Si se desea, el siguiente paso ideal es complementar esta documentación con:

- un mapa detallado por cada módulo funcional
- una guía de base de datos con diagramas
- una lista de endpoints y ejemplos de requests/responses
- una guía de despliegue para producción
