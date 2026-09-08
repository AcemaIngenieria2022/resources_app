/**
 * Generador de PDF para reportes de asistencia
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Genera un PDF con los datos del resumen (igual a http://localhost:3000/summary)
 * @param {Array} summaryData - Datos del resumen
 * @param {string} date - Fecha del reporte (YYYY-MM-DD)
 * @returns {Promise<string>} Ruta del archivo PDF generado
 */
async function generatePDF(summaryData, date) {
  return new Promise((resolve, reject) => {
    try {
      // Crear directorio si no existe
      if (!fs.existsSync(config.reports.output_dir)) {
        fs.mkdirSync(config.reports.output_dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      const filename = path.join(config.reports.output_dir, `summary-${date}.pdf`);
      const stream = fs.createWriteStream(filename);

      doc.pipe(stream);

      // ====== ENCABEZADO (igual a summary page) ======
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#36BBA7').text('RESUMEN DE INGRESOS', { align: 'left' });
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e293b').text('Resumen de Asistencia Diaria', { align: 'left' });
      doc.fontSize(11).font('Helvetica').fillColor('#64748b').text('Consulta los primeros y últimos ingresos del día por colaborador, con filtros por fecha, y registros generales.', { align: 'left' });
      doc.moveDown(0.3);

      // ====== INFORMACIÓN DE RESUMEN ======
      const totalEmployees = summaryData.length;
      const presentToday = summaryData.filter(e => e.first_entry).length;
      const absences = totalEmployees - presentToday;

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text(`Total colaboradores: ${totalEmployees}`, { align: 'right' });
      doc.moveDown(0.5);

      // ====== TABLA (igual a summary page) ======
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margins = 40;
      const tableWidth = pageWidth - 2 * margins;
      const rowHeight = 16; // altura fija de cada fila
      const footerSpace = 40; // espacio reservado para pie de página

      // Definir anchos de columnas (proporcionales a summary)
      const colWidths = {
        name: tableWidth * 0.22,
        dept: tableWidth * 0.20,
        pos: tableWidth * 0.20,
        entry: tableWidth * 0.13,
        exit: tableWidth * 0.13,
        records: tableWidth * 0.12,
      };

      // Función para dibujar encabezado de tabla
      function drawTableHeader() {
        let tableTop = doc.y;
        doc.fillColor('#36BBA7').rect(margins, tableTop, tableWidth, 22).fill();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('white');
        let x = margins + 8;
        doc.text('Nombre', x, tableTop + 4, { width: colWidths.name - 10, ellipsis: true });
        x += colWidths.name;
        doc.text('Departamento', x, tableTop + 4, { width: colWidths.dept - 10, ellipsis: true });
        x += colWidths.dept;
        doc.text('Cargo', x, tableTop + 4, { width: colWidths.pos - 10, ellipsis: true });
        x += colWidths.pos;
        doc.text('Ingreso', x, tableTop + 4, { width: colWidths.entry - 10, align: 'center' });
        x += colWidths.entry;
        doc.text('Salida', x, tableTop + 4, { width: colWidths.exit - 10, align: 'center' });
        x += colWidths.exit;
        doc.text('Registros', x, tableTop + 4, { width: colWidths.records - 10, align: 'center' });
        doc.moveDown(2);
      }

      // ====== ENCABEZADO DE TABLA INICIAL ======
      drawTableHeader();

      // ====== FILAS DE TABLA ======
      doc.font('Helvetica').fontSize(8);
      summaryData.forEach((row, index) => {
        // Calcular si hay espacio en la página actual
        const spaceNeeded = rowHeight + 2;
        const availableSpace = pageHeight - doc.y - footerSpace;

        // Si no hay espacio, crear nueva página con header
        if (availableSpace < spaceNeeded) {
          doc.addPage();
          drawTableHeader();
        }

        let rowY = doc.y;

        // Color alterno de fila (más sutil)
        if (index % 2 === 0) {
          doc.fillColor('#fafcfe').rect(margins, rowY - 1, tableWidth, rowHeight).fill();
        }

        let x = margins + 5;

        // Nombre
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8);
        doc.text(row.personName || '-', x, rowY, { width: colWidths.name - 10, ellipsis: true });
        x += colWidths.name;

        // Departamento
        doc.fillColor('#475569').font('Helvetica').fontSize(8);
        doc.text(row.department_name || 'Sin dept.', x, rowY, { width: colWidths.dept - 10, ellipsis: true });
        x += colWidths.dept;

        // Cargo
        doc.text(row.position_name || 'Sin cargo', x, rowY, { width: colWidths.pos - 10, ellipsis: true });
        x += colWidths.pos;

        // ====== INGRESO (con colores como en summary) ======
        let firstEntry = row.first_entry ? new Date(row.first_entry).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Sin reg.';
        
        let entryColor = '#475569'; // normal
        if (firstEntry !== 'Sin reg.') {
          const [hours, minutes] = firstEntry.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          if (totalMinutes > 7 * 60 + 5) {
            entryColor = '#dc2626'; // rojo (tarde)
          } else if (totalMinutes < 7 * 60 + 5) {
            entryColor = '#548dd2'; // azul (temprano)
          }
        }
        doc.fillColor(entryColor).font('Helvetica-Bold').fontSize(8);
        doc.text(firstEntry, x, rowY, { width: colWidths.entry - 10, align: 'center' });
        x += colWidths.entry;

        // ====== SALIDA (con colores como en summary) ======
        let lastExit = row.last_exit ? new Date(row.last_exit).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Sin reg.';
        
        let exitColor = '#475569'; // normal
        if (lastExit !== 'Sin reg.') {
          const [hours, minutes] = lastExit.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          if (totalMinutes < 16 * 60 + 25) {
            exitColor = '#dc2626'; // rojo (temprano)
          } else if (totalMinutes > 16 * 60 + 25) {
            exitColor = '#16a34a'; // verde (a tiempo)
          }
        }
        doc.fillColor(exitColor).font('Helvetica-Bold').fontSize(8);
        doc.text(lastExit, x, rowY, { width: colWidths.exit - 10, align: 'center' });
        x += colWidths.exit;

        // ====== REGISTROS (compacto) ======
        doc.fillColor('#475569').font('Helvetica').fontSize(7);
        let registrosText = 'Sin reg.';
        if (row.record_times) {
          const records = row.record_times
            .split('||')
            .map((item) => {
              const [time, device] = item.split('|');
              return { time: time?.trim() || '', device: device?.trim().toUpperCase() || 'UNKNOWN' };
            })
            .filter((record) => record.device === 'INTERNO' || record.device === 'EXTERNO');

          if (records.length > 0) {
            registrosText = records.map((r) => r.time).join(', ');
          }
        }
        doc.text(registrosText, x, rowY, { width: colWidths.records - 10, align: 'center', ellipsis: true });

        // Línea separadora muy sutil
        doc.strokeColor('#e5e7eb').lineWidth(0.3);
        doc.moveTo(margins, rowY + rowHeight - 1).lineTo(pageWidth - margins, rowY + rowHeight - 1).stroke();

        doc.moveDown(1.4);
      });

      // Pie de página
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Resumen de Asistencia - Generado automáticamente', { align: 'center' });
      doc.fontSize(7).text(`Fecha: ${new Date(date).toLocaleDateString('es-CO')}`, { align: 'center' });


      doc.end();

      stream.on('finish', () => {
        console.log(`✅ PDF generado: ${filename}`);
        resolve(filename);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generatePDF,
};
