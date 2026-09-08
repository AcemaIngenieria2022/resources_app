/**
 * Generador del mismo PDF que descarga la pagina de summary.
 */

const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const config = require('../config');

function generatePDF(summaryData, date) {
  const rows = Array.isArray(summaryData) ? summaryData : [];
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const footerHeight = 24;
  const columns = [
    { title: 'Nombre', width: 118 },
    { title: 'Cargo', width: 130 },
    { title: 'Ingreso', width: 58 },
    { title: 'Salida', width: 58 },
    { title: 'Novedad', width: 78 },
    { title: 'Registros', width: pageWidth - margin * 2 - 442 },
  ];
  const colors = {
    header: [148, 163, 184], headerDark: [100, 116, 139], dark: [71, 85, 105], muted: [100, 116, 139], soft: [180, 187, 198],
    early: [105, 158, 219], late: [221, 112, 112], green: [91, 176, 119], amber: [190, 133, 57], internal: [145, 195, 160], external: [145, 180, 225],
    border: [203, 213, 225], stripe: [250, 252, 254], department: [226, 232, 240],
  };
  const timeMinutes = (value) => {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const timeText = (value) => {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : 'Sin registro';
  };
  const parseRecords = (value) => {
    const seen = new Set();
    return String(value || '').split('||').map((record) => {
      const [time, device] = record.split('|');
      const normalizedTime = time?.trim();
      const normalizedDevice = device?.trim().toUpperCase();
      const key = `${normalizedTime}|${normalizedDevice}`;
      if (!normalizedTime || !['INTERNO', 'EXTERNO'].includes(normalizedDevice) || seen.has(key)) return null;
      seen.add(key);
      return { time: normalizedTime, device: normalizedDevice };
    }).filter(Boolean);
  };
  const drawHeader = () => {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(17); pdf.setTextColor(...colors.headerDark); pdf.text('RESUMEN DE ASISTENCIA', margin, 23);
    pdf.setFontSize(10); pdf.setTextColor(...colors.dark); pdf.text('Resumen diario organizado por departamento', margin, 35);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...colors.muted); pdf.text(`Fecha consultada: ${date}`, pageWidth - margin, 32, { align: 'right' });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...colors.dark); pdf.text('Guia de lectura', margin, 47);
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...colors.muted);
    pdf.text('Ingreso: azul hasta 07:05 | rojo despues de 07:05 | Salida: rojo antes de 16:25 | verde despues hora jornada', margin, 56);
    pdf.text('Registros: azul = MARCACIÓN EQUIPO EXTERNO | verde = MARCACIÓN EQUIPO INTERNO.', margin, 65);
    pdf.setDrawColor(...colors.border); pdf.setLineWidth(0.6); pdf.line(margin, 73, pageWidth - margin, 73);
    let x = margin;
    columns.forEach((column) => {
      pdf.setFillColor(...colors.header); pdf.setLineWidth(0.25); pdf.rect(x, 79, column.width, 22, 'F'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255); pdf.text(column.title, x + 4, 93); x += column.width;
    });
    return 101;
  };
  const drawGuide = () => {
    const footerY = pageHeight - footerHeight;
    pdf.setDrawColor(...colors.border); pdf.setLineWidth(0.5); pdf.line(margin, footerY, pageWidth - margin, footerY);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...colors.muted);
    pdf.text(`Pagina ${pdf.getNumberOfPages()}`, pageWidth - margin, footerY + 15, { align: 'right' });
  };
  const groups = new Map();
  rows.forEach((row) => {
    const department = row.department_name || 'Sin departamento';
    if (!groups.has(department)) groups.set(department, []);
    groups.get(department).push(row);
  });
  const departments = [...groups.keys()].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  let y = drawHeader();
  let stripeIndex = 0;
  departments.forEach((department) => {
    const departmentRows = groups.get(department);
    if (y + 38 > pageHeight - margin - footerHeight) { pdf.addPage(); y = margin; }
    pdf.setFillColor(...colors.department); pdf.setDrawColor(...colors.border); pdf.setLineWidth(0.25); pdf.rect(margin, y, pageWidth - margin * 2, 17, 'FD');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...colors.dark); pdf.text(`${department} (${departmentRows.length})`, margin + 5, y + 11); y += 17;
    departmentRows.forEach((item) => {
      const records = parseRecords(item.record_times);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5);
      const recordLines = []; let line = []; let lineWidth = 0;
      const recordGap = 4; const recordPadding = 8; const recordHeight = 14;
      records.forEach((record) => {
        const recordWidth = pdf.getTextWidth(record.time) + recordPadding;
        if (line.length && lineWidth + recordGap + recordWidth > columns[5].width - 8) { recordLines.push(line); line = []; lineWidth = 0; }
        line.push(record); lineWidth += (line.length > 1 ? recordGap : 0) + recordWidth;
      });
      if (line.length) recordLines.push(line);
      if (!recordLines.length) recordLines.push([]);
      const values = [item.personName || '-', item.position_name || 'Sin cargo', timeText(item.first_entry), timeText(item.last_exit), item.absence_reason || 'Sin novedad', records.map((record) => record.time).join(' | ') || 'Sin registros'];
      pdf.setFont('helvetica', 'normal');
      const wrapped = values.map((value, index) => pdf.splitTextToSize(String(value), columns[index].width - 8));
      const rowHeight = Math.max(18, recordLines.length * recordHeight + 4, ...wrapped.map((lines) => lines.length * 9 + 6));
      if (y + rowHeight > pageHeight - margin - footerHeight) {
        pdf.addPage(); y = margin; pdf.setFillColor(...colors.department); pdf.rect(margin, y, pageWidth - margin * 2, 17, 'FD');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...colors.dark); pdf.text(`${department} (continua)`, margin + 5, y + 11); y += 17;
      }
      let x = margin;
      columns.forEach((column, cellIndex) => {
        if (stripeIndex % 2 === 0) { pdf.setFillColor(...colors.stripe); pdf.rect(x, y, column.width, rowHeight, 'F'); }
        pdf.setDrawColor(...colors.border); pdf.setLineWidth(0.25); pdf.rect(x, y, column.width, rowHeight);
        if (cellIndex === 5 && records.length) {
          recordLines.forEach((recordLine, lineIndex) => {
            let recordX = x + 4;
            recordLine.forEach((record, recordIndex) => {
              if (recordIndex) recordX += recordGap;
              pdf.setDrawColor(...(record.device === 'INTERNO' ? colors.internal : colors.external)); pdf.setLineWidth(0.6);
              pdf.setFont('helvetica', 'normal');
              const chipWidth = pdf.getTextWidth(record.time) + recordPadding;
              const chipY = y + 2 + lineIndex * recordHeight;
              pdf.roundedRect(recordX, chipY, chipWidth, 11, 5.5, 5.5, 'S');
              pdf.setTextColor(...colors.dark); pdf.text(record.time, recordX + recordPadding / 2, y + 10 + lineIndex * recordHeight); recordX += chipWidth;
            });
          });
        } else {
          const entryMinutes = timeMinutes(item.first_entry); const exitMinutes = timeMinutes(item.last_exit);
          const color = cellIndex === 2 ? (entryMinutes === null ? colors.soft : entryMinutes > 425 ? colors.late : colors.early) : cellIndex === 3 ? (exitMinutes === null ? colors.soft : exitMinutes < 985 ? colors.late : colors.green) : cellIndex === 4 ? (item.absence_reason ? (records.length ? colors.soft : colors.amber) : colors.soft) : cellIndex === 5 ? colors.soft : colors.dark;
          pdf.setTextColor(...color); pdf.setFont('helvetica', cellIndex === 0 ? 'bold' : 'normal'); pdf.setFontSize(7.5);
          wrapped[cellIndex].forEach((textLine, lineIndex) => pdf.text(textLine, x + 4, y + 12 + lineIndex * 9));
        }
        x += column.width;
      });
      y += rowHeight; stripeIndex += 1;
    });
    y += 12;
  });
  if (y + footerHeight > pageHeight - margin) pdf.addPage();
  drawGuide();
  if (!fs.existsSync(config.reports.output_dir)) fs.mkdirSync(config.reports.output_dir, { recursive: true });
  const filename = path.join(config.reports.output_dir, `summary-${date}.pdf`);
  fs.writeFileSync(filename, Buffer.from(pdf.output('arraybuffer')));
  console.log(`PDF generado: ${filename}`);
  return filename;
}

module.exports = { generatePDF };
