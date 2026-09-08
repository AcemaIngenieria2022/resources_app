#!/usr/bin/env node

/**
 * Programador de reportes diarios
 * 
 * Ejecuta send.js automáticamente cada día a una hora configurada
 * Por defecto: 6:00 AM todos los días
 * 
 * Uso:
 *   node scripts/reports/scheduler.js
 * 
 * Presiona Ctrl+C para detener el programador
 * 
 * Configuración:
 *   - Editar la variable SCHEDULE_TIME para cambiar la hora
 *   - Formato cron: "minuto hora día_mes mes día_semana"
 *   - Ejemplos:
 *     "0 6 * * *"     = 6:00 AM diariamente
 *     "0 8 * * 1-5"   = 8:00 AM de lunes a viernes
 *     "30 14 * * *"   = 2:30 PM diariamente
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

// ====================================
// Configuración
// ====================================
const SCHEDULE_TIME = process.env.REPORTS_SCHEDULE_TIME || '0 6 * * *'; // 6:00 AM diario
const SCRIPT_PATH = path.join(__dirname, 'send.js');

// ====================================
// Función para ejecutar el reporte
// ====================================
function runReport() {
  const timestamp = new Date().toLocaleString('es-CO');
  console.log(`\n[${timestamp}] 🚀 Ejecutando reporte diario...`);

  exec(`node "${SCRIPT_PATH}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error al ejecutar reporte:`);
      console.error(stderr);
      return;
    }
    console.log(stdout);
  });
}

// ====================================
// Inicio del programador
// ====================================
console.log('\n' + '='.repeat(60));
console.log('📅 Programador de Reportes Diarios');
console.log('='.repeat(60));
console.log(`📍 Ubicación del script: ${SCRIPT_PATH}`);
console.log(`🕐 Horario configurado: ${SCHEDULE_TIME}`);

// Convertir el cron a texto legible
const cronToText = {
  '0 6 * * *': 'Cada día a las 6:00 AM',
  '0 8 * * 1-5': 'Lunes a viernes a las 8:00 AM',
  '30 14 * * *': 'Cada día a las 2:30 PM',
};
console.log(`⏰ Frecuencia: ${cronToText[SCHEDULE_TIME] || 'Personalizado'}`);
console.log('='.repeat(60));
console.log('✅ Programador iniciado correctamente');
console.log('⚠️  Presiona Ctrl+C para detener\n');

// Programar la tarea
const task = cron.schedule(SCHEDULE_TIME, runReport);

// Ejecutar una primera vez de forma inmediata al iniciar (opcional, comentar si no se desea)
// runReport();

// Permitir detener el script con Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n' + '='.repeat(60));
  console.log('⛔ Programador detenido');
  console.log('='.repeat(60) + '\n');
  task.stop();
  process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('\n❌ Error no capturado:', error);
  console.error('El programador se detendrá.');
  task.stop();
  process.exit(1);
});
