# 📊 Sistema de Reportes de Asistencia

Sistema completo para generar y enviar reportes diarios de asistencia en formato PDF y Excel, con envío automático por correo a los destinatarios configurados.

## 📁 Estructura de carpetas

```
/scripts/reports/
├── send.js                    # Script principal para generar y enviar reportes
├── scheduler.js               # Programador automático de reportes diarios
├── config.js                  # Configuración centralizada
└── lib/
    ├── database.js           # Conexión y consultas de base de datos
    ├── pdf-generator.js      # Generador de archivos PDF
    ├── excel-generator.js    # Generador de archivos Excel
    └── email-service.js      # Servicio de envío de emails
```

## 🚀 Uso

### 1. Generar reporte manual

Genera un reporte para la fecha actual:

```bash
node scripts/reports/send.js
```

Genera un reporte para una fecha específica:

```bash
node scripts/reports/send.js 2026-04-01
```

### 2. Programar ejecución automática

Ejecuta el programador que generará reportes cada día a las 6:00 AM:

```bash
node scripts/reports/scheduler.js
```

Para mantener el programador ejecutándose en segundo plano en Windows, utiliza:

```bash
# Crear una tarea programada en Windows
node setup-windows-task.js
```

O usa npm scripts en `package.json`:

```json
{
  "scripts": {
    "reports:send": "node scripts/reports/send.js",
    "reports:schedule": "node scripts/reports/scheduler.js"
  }
}
```

Entonces ejecuta:

```bash
npm run reports:send          # Generar reporte manual
npm run reports:schedule      # Programador automático
```

## ⚙️ Configuración

### Credenciales de correo

Edita `scripts/reports/config.js`:

```javascript
mail: {
  from_email: 'InformesTI@acemaingenieria.com',
  alias_name: 'Operaciones TI Acema Ingenieria',
  to_email: [
    'gerencia@acemaingenieria.com',
    'winder.juarez@acemaingenieria.com',
    // ... más destinatarios
  ],
  cc_email: ['ti@acemaingenieria.com'],
  smtp_server: 'smtp-mail.outlook.com',
  smtp_port: 587,
  password: 'zjgqknmyltbhhnbb',
}
```

### Configuración de base de datos

Se lee automáticamente del archivo `.env.local`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=thirdpartydb
```

### Horario de ejecución

Edita el archivo `scripts/reports/scheduler.js` o usa variables de entorno:

```bash
# Cambiar horario (formato cron)
set REPORTS_SCHEDULE_TIME=0 8 * * *        # 8:00 AM diariamente
node scripts/reports/scheduler.js
```

**Ejemplos de formato cron:**

- `0 6 * * *` → 6:00 AM todos los días
- `0 8 * * 1-5` → 8:00 AM de lunes a viernes
- `30 14 * * *` → 2:30 PM todos los días
- `0 */4 * * *` → Cada 4 horas

## 📧 Salida de reportes

### Ubicación de archivos

Los archivos generados se guardan en:

```
/reports/
├── summary-2026-04-01.pdf
├── summary-2026-04-01.xlsx
├── summary-2026-04-02.pdf
├── summary-2026-04-02.xlsx
...
```

### Contenido del email

**De:** Operaciones TI Acema Ingenieria <InformesTI@acemaingenieria.com>

**Para:** gerencia@acemaingenieria.com, winder.juarez@acemaingenieria.com, ...

**CC:** ti@acemaingenieria.com

**Asunto:** Resumen de Asistencia Diaria - 2026-04-01

**Archivos adjuntos:**
- `summary-2026-04-01.pdf` - Resumen visual con tabla formateada
- `summary-2026-04-01.xlsx` - Datos completos con gráficos

## 📋 Contenido de reportes

### PDF
- Fecha del reporte
- Fecha de generación
- Total de colaboradores
- Colaboradores presentes
- Tabla con información:
  - Nombre del empleado
  - Departamento
  - Cargo
  - Primer ingreso del día
  - Último egreso del día
  - Total de registros

### Excel
- Misma información que PDF
- Datos adicionales y formateables
- Resumen estadístico al final
- Estilos y formato profesional

## 🔧 Solución de problemas

### Error: "Module not found"

Instala las dependencias:

```bash
npm install
```

### Error: "Can't connect to database"

Verifica que:
1. El servidor MySQL esté ejecutándose
2. Las credenciales en `.env.local` sean correctas
3. La base de datos `thirdpartydb` existe

Prueba la conexión:

```bash
node -e "require('./scripts/reports/lib/database.js').testConnection().then(() => process.exit(0))"
```

### Error: "Email not sent"

Verifica que:
1. Las credenciales de correo sean correctas
2. El servidor SMTP sea accesible (smtp-mail.outlook.com:587)
3. Tengas conexión a internet
4. La contraseña sea una "contraseña de aplicación" de Outlook

### Los archivos no se generan

Verifica que:
1. Tengas permisos de escritura en la carpeta `/reports/`
2. Haya suficiente espacio en disco
3. Los datos se estén recuperando correctamente de la BD

## 🔒 Seguridad

⚠️ **Importante:** 

- No compartas el archivo `config.js` públicamente (contiene credenciales)
- Usa variables de entorno para credenciales en producción
- Considera usar "contraseñas de aplicación" de Outlook en lugar de la contraseña principal
- Mantén los archivos de reportes en una carpeta con acceso restringido

## 📞 Soporte

Para cambios en:

- **Destinatarios** → Edita `scripts/reports/config.js`
- **Horario** → Usa variables de entorno o edita `scheduler.js`
- **Formato de reportes** → Edita `lib/pdf-generator.js` o `lib/excel-generator.js`
- **Conexión BD** → Verifica `.env.local`

## 📦 Dependencias

- `node-cron` - Programación de tareas
- `nodemailer` - Envío de emails
- `pdfkit` - Generación de PDF
- `exceljs` - Generación de Excel
- `mysql2` - Conexión a base de datos

## 📅 Historial de cambios

### v1.0 (2026-04-13)
- Estructura de carpetas profesional
- Módulos separados por responsabilidad
- Generación de PDF y Excel
- Envío automático por correo
- Programador de tareas cron
- Documentación completa
