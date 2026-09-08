/**
 * Generador de Excel para reportes de asistencia
 * Agrupa colaboradores por departamento
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Agrupa datos por departamento
 */
function groupByDepartment(data) {
  const groups = new Map();
  const order = [];
  
  data.forEach((item) => {
    const dept = item.department_name || 'Sin departamento';
    if (!groups.has(dept)) {
      groups.set(dept, []);
      order.push(dept);
    }
    groups.get(dept).push(item);
  });
  
  // Ordenar alfabéticamente
  order.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  
  return { groups, order };
}

/**
 * Genera un Excel con los datos del resumen
 * @param {Array} summaryData - Datos del resumen
 * @param {string} date - Fecha del reporte (YYYY-MM-DD)
 * @returns {Promise<string>} Ruta del archivo Excel generado
 */
async function generateExcel(summaryData, date) {
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(config.reports.output_dir)) {
      fs.mkdirSync(config.reports.output_dir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resumen de Asistencia');

    // ====== ENCABEZADO (igual a summary page) ======
    let rowNum = 1;
    
    const titleRow = worksheet.addRow(['RESUMEN DE INGRESOS']);
    titleRow.font = { size: 10, bold: true, color: { argb: 'FF36BBA7' } };
    titleRow.alignment = { horizontal: 'left', vertical: 'middle' };

    const subtitleRow = worksheet.addRow(['Resumen de Asistencia Diaria']);
    subtitleRow.font = { size: 16, bold: true, color: { argb: 'FF1e293b' } };
    subtitleRow.alignment = { horizontal: 'left', vertical: 'middle' };

    const descRow = worksheet.addRow(['Consulta los primeros y últimos ingresos del día por colaborador, con filtros por fecha, y registros generales.']);
    descRow.font = { size: 11, color: { argb: 'FF64748b' } };
    descRow.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    descRow.height = 30;

    const metaRow = worksheet.addRow([`Total colaboradores: ${summaryData.length}`]);
    metaRow.font = { size: 11, bold: true, color: { argb: 'FF1e293b' } };
    metaRow.alignment = { horizontal: 'right', vertical: 'middle' };

    worksheet.addRow([]); // Fila vacía

    // ====== ENCABEZADOS (igual a summary page - #36BBA7, SIN departamento) ======
    const headerRow = worksheet.addRow(['Nombre', 'Cargo', 'Primer Ingreso', 'Último Egreso', 'Novedad', 'Registros']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF36BBA7' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 20;

    // Definir anchos de columnas (sin departamento)
    worksheet.columns = [
      { width: 25 },  // Nombre
      { width: 20 },  // Cargo
      { width: 18 },  // Primer Ingreso
      { width: 18 },  // Último Egreso
      { width: 28 },  // Novedad
      { width: 30 },  // Registros
    ];

    // ====== DATOS (agrupados por departamento) ======
    // Agrupar datos
    const { groups, order } = groupByDepartment(summaryData);
    let dataRowIndex = 0;

    // Iterar por cada departamento
    order.forEach((dept) => {
      const employees = groups.get(dept);

      // Encabezado del departamento
      const deptHeaderRow = worksheet.addRow([`${dept} (${employees.length} colaboradores)`, '', '', '', '', '']);
      deptHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC1F2EA' } };
      deptHeaderRow.font = { bold: true, color: { argb: 'FF1e293b' } };
      deptHeaderRow.alignment = { horizontal: 'left', vertical: 'middle' };
      deptHeaderRow.height = 18;

      // Datos de empleados
      employees.forEach((row, index) => {
        // Parsear registros (tiempos de INTERNO/EXTERNO)
        let registrosText = 'Sin registros';
        if (row.record_times) {
          const records = row.record_times
            .split('||')
            .map((item) => {
              const [time, device] = item.split('|');
              return { time: time?.trim() || '', device: device?.trim().toUpperCase() || 'UNKNOWN' };
            })
            .filter((record) => record.device === 'INTERNO' || record.device === 'EXTERNO');

          if (records.length > 0) {
            registrosText = records.map((r) => `${r.time} (${r.device})`).join(' | ');
          }
        }

        // Formatear tiempos
        let firstEntry = row.first_entry 
          ? new Date(row.first_entry).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
          : 'Sin registro';
        let lastExit = row.last_exit 
          ? new Date(row.last_exit).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
          : 'Sin registro';

        const dataRow = worksheet.addRow([
          row.personName || '-',
          row.position_name || 'Sin cargo',
          firstEntry,
          lastExit,
          row.absence_reason || 'Sin novedad',
          registrosText,
        ]);

        // Estilos de fila
        dataRow.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        dataRow.height = 18;

        // Color alterno de filas
        if (index % 2 === 0) {
          dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFafcfe' } };
        }

        // Estilos específicos por columna
        // Nombre (bold)
        dataRow.getCell(1).font = { bold: true, color: { argb: 'FF1e293b' } };

        // Cargo
        dataRow.getCell(2).font = { color: { argb: 'FF475569' } };

        // Primer Ingreso (con colores: #dc2626=late, #548dd2=early)
        let entryColor = 'FF475569'; // normal
        if (firstEntry !== 'Sin registro') {
          const [hours, minutes] = firstEntry.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          if (totalMinutes > 7 * 60 + 5) {
            entryColor = 'FFdc2626'; // timeLate (rojo)
          } else if (totalMinutes < 7 * 60 + 5) {
            entryColor = 'FF548dd2'; // timeEarly (azul)
          }
        }
        dataRow.getCell(3).font = { bold: true, color: { argb: entryColor } };
        dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

        // Último Egreso (con colores: #dc2626=late, #16a34a=green)
        let exitColor = 'FF475569'; // normal
        if (lastExit !== 'Sin registro') {
          const [hours, minutes] = lastExit.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          if (totalMinutes < 16 * 60 + 25) {
            exitColor = 'FFdc2626'; // timeLate (rojo)
          } else if (totalMinutes > 16 * 60 + 25) {
            exitColor = 'FF16a34a'; // timeGreen (verde)
          }
        }
        dataRow.getCell(4).font = { bold: true, color: { argb: exitColor } };
        dataRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

        // Novedad
        dataRow.getCell(5).font = {
          bold: Boolean(row.absence_reason),
          color: { argb: row.absence_reason ? 'FFb45309' : 'FFb4bbc6' },
        };

        // Registros
        dataRow.getCell(6).font = { size: 10, color: { argb: 'FF475569' } };

        // Bordes
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFe2e8f0' } },
            left: { style: 'thin', color: { argb: 'FFe2e8f0' } },
            bottom: { style: 'thin', color: { argb: 'FFe2e8f0' } },
            right: { style: 'thin', color: { argb: 'FFe2e8f0' } },
          };
        });
      });
    });

    // ====== RESUMEN ESTADÍSTICO ======
    worksheet.addRow([]); // Fila vacía
    const presentToday = summaryData.filter(e => e.first_entry).length;
    const absences = summaryData.length - presentToday;

    const summaryLabel1 = worksheet.addRow(['Total de colaboradores', summaryData.length]);
    summaryLabel1.getCell(1).font = { bold: true, color: { argb: 'FF1e293b' } };
    summaryLabel1.getCell(2).font = { bold: true, color: { argb: 'FF36BBA7' } };

    const summaryLabel2 = worksheet.addRow(['Colaboradores presentes', presentToday]);
    summaryLabel2.getCell(1).font = { bold: true, color: { argb: 'FF1e293b' } };
    summaryLabel2.getCell(2).font = { bold: true, color: { argb: 'FF16a34a' } };

    const summaryLabel3 = worksheet.addRow(['Ausencias', absences]);
    summaryLabel3.getCell(1).font = { bold: true, color: { argb: 'FF1e293b' } };
    summaryLabel3.getCell(2).font = { bold: true, color: { argb: 'FFdc2626' } };

    // ====== GUARDAR ======
    const filename = path.join(config.reports.output_dir, `summary-${date}.xlsx`);
    await workbook.xlsx.writeFile(filename);
    console.log(`✅ Excel generado: ${filename}`);
    return filename;
  } catch (error) {
    console.error('❌ Error al generar Excel:', error.message);
    throw error;
  }
}

module.exports = {
  generateExcel,
};
