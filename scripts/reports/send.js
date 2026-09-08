#!/usr/bin/env node

/**
 * Script para enviar reporte diario de asistencia por correo
 * 
 * Uso:
 *   node scripts/reports/send.js [YYYY-MM-DD]
 * 
 * Ejemplos:
 *   node scripts/reports/send.js                 # Usa la fecha de hoy
 *   node scripts/reports/send.js 2026-04-01      # Usa la fecha especificada
 * 
 * Genera:
 *   - Archivo PDF con el resumen de asistencia
 *   - Archivo Excel con los datos detallados
 *   - Envía ambos por correo a los destinatarios configurados
 */

const path = require('path');
const fs = require('fs');

// Importar módulos del proyecto
const { getSummaryData, testConnection } = require('./lib/database');
const { generatePDF } = require('./lib/pdf-generator');
const { generateExcel } = require('./lib/excel-generator');
const { sendReport } = require('./lib/email-service');

/**
 * Obtiene la fecha a usar para el reporte
 */
function getReportDate() {
  const arg = process.argv[2];
  
  // Validar formato de fecha si se proporciona
  if (arg) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(arg)) {
      console.error('❌ Formato de fecha inválido. Use YYYY-MM-DD');
      console.error(`   Ejemplo: node send.js 2026-04-01`);
      process.exit(1);
    }
    
    // Validar que sea una fecha válida
    const date = new Date(arg);
    if (Number.isNaN(date.getTime())) {
      console.error('❌ Fecha inválida');
      process.exit(1);
    }
    
    return arg;
  }
  
  // Usar fecha de hoy en formato YYYY-MM-DD
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Función principal
 */
async function main() {
  const startTime = Date.now();
  const reportDate = getReportDate();

  try {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Sistema de Reportes de Asistencia');
    console.log('='.repeat(60));
    console.log(`📅 Fecha del reporte: ${reportDate}`);
    console.log(`⏱️  Iniciado: ${new Date().toLocaleString('es-CO')}`);
    console.log('='.repeat(60) + '\n');

    // Paso 1: Verificar conexión a BD
    console.log('1️⃣  Verificando conexión a base de datos...');
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Paso 2: Obtener datos del resumen
    console.log('\n2️⃣  Obteniendo datos del resumen...');
    const summaryData = await getSummaryData(reportDate);
    console.log(`   ✓ Encontrados ${summaryData.length} colaboradores`);

    if (summaryData.length === 0) {
      console.warn('   ⚠️  No hay datos para la fecha especificada');
    }

    // Paso 3: Generar PDF
    console.log('\n3️⃣  Generando PDF...');
    const pdfPath = await generatePDF(summaryData, reportDate);

    // Paso 4: Generar Excel
    console.log('\n4️⃣  Generando Excel...');
    const excelPath = await generateExcel(summaryData, reportDate);

    // Paso 5: Enviar email
    console.log('\n5️⃣  Enviando email con reportes...');
    await sendReport(pdfPath, excelPath, reportDate);

    // Resumen final
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('✅ Reporte completado exitosamente');
    console.log('='.repeat(60));
    console.log(`⏱️  Tiempo total: ${duration}s`);
    console.log(`📁 Archivos guardados en: ./reports/`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('\n' + '='.repeat(60));
    console.error('❌ Error en la generación del reporte');
    console.error('='.repeat(60));
    console.error(`Mensaje: ${error.message}`);
    console.error(`Tiempo: ${duration}s`);
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Ejecutar script
main();
