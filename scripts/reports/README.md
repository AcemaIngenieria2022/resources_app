# 📊 Sistema de Reportes de Asistencia

Esta carpeta contiene el sistema completo para generar y enviar reportes diarios de asistencia en formato PDF y Excel.

## 📂 Estructura

```
scripts/reports/
├── send.js              # Script principal de reportes
├── scheduler.js         # Programador automático de tareas
├── config.js            # Configuración centralizada
└── lib/
    ├── database.js      # Conexión y consultas BD
    ├── pdf-generator.js # Generador de PDF
    ├── excel-generator.js # Generador de Excel
    └── email-service.js # Servicio de email
```

## 🚀 Uso rápido

### Generar un reporte

```bash
# Reporte de hoy
node scripts/reports/send.js

# Reporte de fecha específica
node scripts/reports/send.js 2026-04-01
```

### Programar ejecución automática

```bash
# Ejecutar cada día a las 6:00 AM
node scripts/reports/scheduler.js
```

## 📚 Documentación

- [REPORTES.md](../../docs/REPORTES.md) - Documentación completa del sistema
- [INSTALACION-REPORTES.md](../../docs/INSTALACION-REPORTES.md) - Guía de instalación y configuración

## ⚙️ Configuración

Edita `config.js` para cambiar:

- Credenciales de correo
- Lista de destinatarios
- Credenciales de base de datos
- Directorio de salida

```javascript
// config.js
module.exports = {
  mail: {
    from_email: 'tuemail@acemaingenieria.com',
    to_email: ['destinatario@example.com'],
    // ...
  }
}
```

## 📧 Salida

Los reportes se guardan en `/reports/`:

- `summary-YYYY-MM-DD.pdf` - Resumen visual
- `summary-YYYY-MM-DD.xlsx` - Datos detallados

## 🔧 Tecnología

- **Node.js** - Runtime
- **node-cron** - Programación de tareas
- **pdfkit** - Generación de PDF
- **exceljs** - Generación de Excel
- **nodemailer** - Envío de emails
- **mysql2** - Conexión a BD

## 📞 Soporte

Consulta la documentación en `/docs/` para ayuda detallada.
