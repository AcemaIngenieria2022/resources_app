## 🎯 Inicio Rápido - Sistema de Reportes

### ✅ Estructura organizada

El sistema de reportes está completamente organizado en `/scripts/reports/`:

```
📁 proyecto/
├── 📂 scripts/
│   └── 📂 reports/
│       ├── 📄 config.js              ⚙️  Configuración (credenciales)
│       ├── 📄 send.js                🚀 Script principal
│       ├── 📄 scheduler.js           🕐 Programador automático
│       ├── 📄 README.md              📖 Documentación local
│       └── 📂 lib/
│           ├── 📄 database.js        💾 Conexión a BD
│           ├── 📄 pdf-generator.js   📕 Generador PDF
│           ├── 📄 excel-generator.js 📗 Generador Excel
│           └── 📄 email-service.js   📧 Servicio de email
├── 📂 docs/
│   ├── 📄 REPORTES.md               📚 Documentación completa
│   └── 📄 INSTALACION-REPORTES.md   🔧 Guía de instalación
├── 📂 reports/                       📁 (se crea automáticamente)
│   ├── summary-2026-04-13.pdf
│   ├── summary-2026-04-13.xlsx
│   └── ...
└── 📄 package.json                   ✨ Scripts npm listos
```

### 🚀 Comandos rápidos

**Generar un reporte (hoy):**
```bash
npm run reports:send
# o
node scripts/reports/send.js
```

**Generar reporte de fecha específica:**
```bash
node scripts/reports/send.js 2026-04-01
```

**Programar ejecución automática (6:00 AM cada día):**
```bash
npm run reports:schedule
# o
node scripts/reports/scheduler.js
```

### ⚙️ Configuración necesaria

Edita `scripts/reports/config.js`:

```javascript
mail: {
  from_email: 'tu-email@acemaingenieria.com',
  to_email: [
    'destinatario1@acemaingenieria.com',
    'destinatario2@acemaingenieria.com',
  ],
  cc_email: ['copia@acemaingenieria.com'],
  // ... más configuración
}
```

### 📧 ¿Qué genera?

- **PDF**: Resumen visual con tabla profesional
- **Excel**: Datos detallados con formato y estilos
- **Email**: Automático a los destinatarios configurados

### 📞 Documentación completa

- 📖 **REPORTES.md** - Uso y características
- 🔧 **INSTALACION-REPORTES.md** - Setup y troubleshooting

### ✨ Características

✅ Estructura profesional y modular
✅ Separación de responsabilidades
✅ Configuración centralizada
✅ Generación automática de PDF y Excel
✅ Envío de email con attachments
✅ Programador de tareas cron
✅ Código limpio y bien documentado
✅ Manejo de errores robusto

¡Listo para usar! 🎉
