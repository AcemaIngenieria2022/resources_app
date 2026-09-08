# 🚀 Guía de Instalación y Configuración - Sistema de Reportes

## Paso 1: Instalar dependencias

Las dependencias ya deberían estar instaladas en `package.json`, pero asegúrate ejecutando:

```bash
npm install
```

Si no están todas instaladas, instala manualmente:

```bash
npm install node-cron nodemailer pdfkit exceljs mysql2
```

## Paso 2: Configurar credenciales

### Base de Datos

Verifica que el archivo `.env.local` tenga las credenciales correctas:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=thirdpartydb
```

Prueba la conexión:

```bash
node -e "
const db = require('./scripts/reports/lib/database.js');
db.testConnection().then(success => {
  if (success) console.log('✅ BD OK');
  else console.log('❌ Falló conexión');
  process.exit(success ? 0 : 1);
});
"
```

### Correo Electrónico

Edita `scripts/reports/config.js` y actualiza:

```javascript
mail: {
  from_email: 'tu-correo@acemaingenieria.com',
  alias_name: 'Tu Nombre',
  to_email: [
    'destinatario1@example.com',
    'destinatario2@example.com',
  ],
  cc_email: ['copia@example.com'],
  smtp_server: 'smtp-mail.outlook.com',
  smtp_port: 587,
  password: 'tu-contraseña-de-aplicación',
}
```

**Para Outlook/Microsoft 365:**

1. Habilita autenticación de dos factores
2. Ve a https://account.microsoft.com/security-settings/app-passwords
3. Genera una "Contraseña de aplicación" para "Otra aplicación (personalizada)"
4. Usa esa contraseña en lugar de tu contraseña principal

## Paso 3: Prueba manual

Genera un reporte de prueba para hoy:

```bash
node scripts/reports/send.js
```

O para una fecha específica:

```bash
node scripts/reports/send.js 2026-04-01
```

**Resultado esperado:**

```
============================================================
📊 Sistema de Reportes de Asistencia
============================================================
📅 Fecha del reporte: 2026-04-13
⏱️  Iniciado: 2026-04-13 14:30:45

1️⃣  Verificando conexión a base de datos...
✅ Conexión a base de datos exitosa

2️⃣  Obteniendo datos del resumen...
   ✓ Encontrados 45 colaboradores

3️⃣  Generando PDF...
✅ PDF generado: ./reports/summary-2026-04-13.pdf

4️⃣  Generando Excel...
✅ Excel generado: ./reports/summary-2026-04-13.xlsx

5️⃣  Enviando email con reportes...
✅ Email enviado exitosamente
   MessageId: <123456@example.com>

============================================================
✅ Reporte completado exitosamente
============================================================
⏱️  Tiempo total: 5.43s
📁 Archivos guardados en: ./reports/
============================================================
```

## Paso 4: Programar ejecución automática

### Opción A: Ejecutar desde Node.js

Inicia el programador:

```bash
node scripts/reports/scheduler.js
```

Esto ejecutará reportes cada día a las 6:00 AM. Presiona Ctrl+C para detener.

**Configurar otra hora:**

Edita `scripts/reports/scheduler.js`, línea:

```javascript
const SCHEDULE_TIME = '0 6 * * *'; // Cambiar aquí
```

### Opción B: Usar npm scripts

Agrega a `package.json`:

```json
{
  "scripts": {
    "reports:once": "node scripts/reports/send.js",
    "reports:schedule": "node scripts/reports/scheduler.js"
  }
}
```

Luego ejecuta:

```bash
npm run reports:once          # Una vez
npm run reports:schedule      # Automático todos los días
```

### Opción C: Windows Task Scheduler (Recomendado)

Crea un archivo `setup-task.bat`:

```batch
@echo off
REM Crear tarea programada en Windows para ejecutar el reporte

REM Ubicación del script
set SCRIPT_PATH=%~dp0scripts\reports\send.js

REM Crear tarea que se ejecute diariamente a las 6:00 AM
schtasks /create /tn "Daily Attendance Report" /tr "node \"%SCRIPT_PATH%\"" /sc DAILY /st 06:00 /f

echo Tarea programada: "Daily Attendance Report"
echo Hora: 6:00 AM todos los dias
pause
```

Guarda como `setup-task.bat` en la raíz del proyecto y ejecuta como administrador:

```bash
setup-task.bat
```

Para desactivar la tarea:

```bash
schtasks /delete /tn "Daily Attendance Report" /f
```

Para ver el estado:

```bash
schtasks /query /tn "Daily Attendance Report"
```

### Opción D: Linux/Mac cron

Edita el crontab:

```bash
crontab -e
```

Agrega la línea:

```
0 6 * * * cd /ruta/al/proyecto && node scripts/reports/send.js >> /var/log/reports.log 2>&1
```

## Paso 5: Estructura de carpetas final

Verifica que la estructura sea:

```
proyecto/
├── scripts/
│   └── reports/
│       ├── send.js
│       ├── scheduler.js
│       ├── config.js
│       └── lib/
│           ├── database.js
│           ├── pdf-generator.js
│           ├── excel-generator.js
│           └── email-service.js
├── docs/
│   ├── REPORTES.md
│   └── INSTALACION.md
├── reports/                    # Se crea automáticamente
│   ├── summary-2026-04-13.pdf
│   ├── summary-2026-04-13.xlsx
│   ...
├── .env.local
├── package.json
└── ...
```

## 🔍 Verificaciones

### ✅ Base de datos

```bash
# Verificar conexión
mysql -h127.0.0.1 -uroot -ppassword -D thirdpartydb -e "SELECT COUNT(*) FROM employees;"
```

### ✅ Correo

Prueba el envío manual:

```javascript
const emailService = require('./scripts/reports/lib/email-service.js');
// Prueba aquí si es necesario
```

### ✅ Archivos

```bash
# Listar reportes generados
dir reports\
ls -la reports/
```

## 📝 Comandos útiles

```bash
# Generar reporte manual
node scripts/reports/send.js

# Generar reporte para fecha específica
node scripts/reports/send.js 2026-04-01

# Iniciar programador automático
node scripts/reports/scheduler.js

# Ver logs de reportes (Linux/Mac)
tail -f /var/log/reports.log

# Eliminar reportes antiguos
rm reports/summary-*.pdf
rm reports/summary-*.xlsx
```

## ❌ Solución de problemas

### "Cannot find module 'node-cron'"

```bash
npm install node-cron
```

### "ECONNREFUSED - Can't connect to MySQL server"

1. Verifica que MySQL esté corriendo
2. Verifica host/usuario/contraseña en `.env.local`
3. Verifica que la base de datos exista

### "Auth failed for email"

1. Verifica contraseña en `config.js`
2. Usa contraseña de aplicación (no la contraseña principal)
3. Verifica que la cuenta de correo tenga autenticación habilitada

### "EACCES - Permission denied"

Asegúrate de tener permisos en la carpeta:

```bash
# Linux/Mac
chmod +x scripts/reports/send.js
chmod +x scripts/reports/scheduler.js

# Crear carpeta reports con permisos
mkdir -p reports
chmod 755 reports
```

## 📞 Contacto y soporte

Si necesitas ayuda:

1. Revisa los logs en la carpeta `reports/`
2. Ejecuta en modo verbose para más detalles
3. Consulta la documentación en `docs/REPORTES.md`
