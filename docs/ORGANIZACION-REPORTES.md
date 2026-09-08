# ✅ Organización Profesional - Sistema de Reportes

## 🎯 Resumen de cambios

He reorganizado completamente el sistema de reportes en una **estructura profesional y modular**. Todo está ahora organizado en carpetas específicas siguiendo las mejores prácticas.

---

## 📂 Estructura Final

### Carpeta Principal: `/scripts/reports/`

**Archivos principales:**

```
scripts/reports/
├── config.js              → Configuración centralizada de credenciales
├── send.js                → Script principal para generar y enviar reportes
├── scheduler.js           → Programador automático de tareas diarias
├── README.md              → Documentación local del módulo
└── lib/
    ├── database.js        → Servicio de conexión y consultas a BD
    ├── pdf-generator.js   → Generador de archivos PDF profesionales
    ├── excel-generator.js → Generador de hojas de Excel formateadas
    └── email-service.js   → Servicio de envío de emails con nodemailer
```

**Beneficios de esta estructura:**

✅ **Separación de responsabilidades** - Cada módulo tiene un propósito único  
✅ **Reutilizable** - Los módulos en `lib/` pueden usarse independientemente  
✅ **Mantenible** - Código organizado y fácil de entender  
✅ **Escalable** - Fácil de agregar nuevas funcionalidades  
✅ **Profesional** - Sigue estándares de la industria  

---

## 📚 Documentación

Todos los archivos de documentación están en `/docs/`:

| Archivo | Propósito |
|---------|-----------|
| **QUICKSTART-REPORTES.md** | 🚀 Inicio rápido (comandos básicos) |
| **REPORTES.md** | 📖 Documentación completa del sistema |
| **INSTALACION-REPORTES.md** | 🔧 Guía de instalación y configuración |

---

## 🚀 Cómo usar

### 1️⃣ Generar un reporte manualmente

```bash
npm run reports:send
```

O con fecha específica:

```bash
node scripts/reports/send.js 2026-04-01
```

### 2️⃣ Programar ejecución automática

```bash
npm run reports:schedule
```

Esto ejecutará reportes cada día a las 6:00 AM.

### 3️⃣ Configurar credenciales

Edita `scripts/reports/config.js`:

```javascript
mail: {
  from_email: 'InformesTI@acemaingenieria.com',
  to_email: [
    'gerencia@acemaingenieria.com',
    'winder.juarez@acemaingenieria.com',
    // ... más destinatarios
  ],
  cc_email: ['ti@acemaingenieria.com'],
  // ... credenciales SMTP
}
```

---

## 📊 Archivos generados

Los reportes se guardan en `/reports/` con esta estructura:

```
reports/
├── summary-2026-04-13.pdf   ← Resumen visual profesional
├── summary-2026-04-13.xlsx  ← Datos detallados con formato
├── summary-2026-04-14.pdf
├── summary-2026-04-14.xlsx
└── ... (uno por cada día)
```

---

## 🧩 Módulos disponibles

### `config.js`
Configuración centralizada:
```javascript
const config = require('./config');
console.log(config.mail.from_email);        // Email del remitente
console.log(config.database.host);          // Host de BD
console.log(config.reports.output_dir);     // Directorio de salida
```

### `lib/database.js`
Consultas a base de datos:
```javascript
const { getSummaryData, testConnection } = require('./lib/database');
const data = await getSummaryData('2026-04-01');
```

### `lib/pdf-generator.js`
Generación de PDF:
```javascript
const { generatePDF } = require('./lib/pdf-generator');
const path = await generatePDF(summaryData, '2026-04-01');
```

### `lib/excel-generator.js`
Generación de Excel:
```javascript
const { generateExcel } = require('./lib/excel-generator');
const path = await generateExcel(summaryData, '2026-04-01');
```

### `lib/email-service.js`
Envío de emails:
```javascript
const { sendReport } = require('./lib/email-service');
await sendReport(pdfPath, excelPath, '2026-04-01');
```

---

## 🔧 Scripts npm

Agregados a `package.json`:

```json
{
  "scripts": {
    "reports:send": "node scripts/reports/send.js",
    "reports:send:date": "node scripts/reports/send.js",
    "reports:schedule": "node scripts/reports/scheduler.js"
  }
}
```

Uso:

```bash
npm run reports:send       # Generar reporte de hoy
npm run reports:schedule   # Programador automático
```

---

## 🗑️ Archivos eliminados

Se eliminaron los archivos antiguos de la raíz del proyecto:

- ❌ `send-daily-report.js` → Movido a `scripts/reports/send.js`
- ❌ `schedule-daily-report.js` → Movido a `scripts/reports/scheduler.js`
- ❌ `setup-scheduled-task.bat` → Documentado en guía
- ❌ `GUIA-REPORTES.md` → Reemplazado por docs profesionales
- ❌ `README-REPORTES.md` → Reemplazado por docs profesionales

---

## 🌟 Características incluidas

### Generación de reportes
- ✅ PDF con tabla profesional y información agregada
- ✅ Excel con formato, colores y resumen estadístico
- ✅ Datos de BD actualizados cada vez

### Envío de emails
- ✅ Configuración flexible de destinatarios
- ✅ HTML formateado con branding
- ✅ Adjuntos PDF y Excel

### Programación automática
- ✅ Cron jobs con `node-cron`
- ✅ Ejecutable cada día a hora configurable
- ✅ Windows Task Scheduler compatible

### Código de calidad
- ✅ Módulos independientes y reutilizables
- ✅ Manejo robusto de errores
- ✅ Logs informativos en consola
- ✅ Validación de entrada

### Documentación completa
- ✅ Guía de inicio rápido
- ✅ Documentación técnica detallada
- ✅ Guía de instalación paso a paso
- ✅ Ejemplos de uso

---

## 📞 Próximos pasos

1. **Configurar credenciales** en `scripts/reports/config.js`
2. **Testear** con: `npm run reports:send`
3. **Programar** con: `npm run reports:schedule`
4. **Consultar docs** si necesitas cambios

---

## 🎓 Beneficios de esta organización

| Aspecto | Beneficio |
|--------|-----------|
| **Mantenibilidad** | Código organizado, fácil de actualizar |
| **Reutilización** | Módulos independientes y componibles |
| **Escalabilidad** | Fácil agregar nuevas funcionalidades |
| **Profesionalismo** | Estructura de proyecto serio |
| **Documentación** | Completa y accesible |
| **Testing** | Código aislado y testeable |
| **Colaboración** | Otros desarrolladores entienden fácilmente |
| **Versionamiento** | Fácil de trackear cambios en git |

---

## 🎉 ¡Sistema listo!

Tu sistema de reportes está completamente organizado y listo para producción.

**Próximo paso:** Lee [QUICKSTART-REPORTES.md](./QUICKSTART-REPORTES.md) para comandos rápidos.
