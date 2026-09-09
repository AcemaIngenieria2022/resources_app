// Utilidades para exportar contenido desde el navegador a CSV, PDF y XLSX.
// Las funciones mantienen el flujo de descarga en el cliente sin depender de un backend adicional.
export function downloadCsv(data, filename = 'export.csv') {
  // If data is already a string, treat it as CSV content
  let csv = '';
  if (typeof data === 'string') {
    csv = data;
  } else if (Array.isArray(data)) {
    if (data.length === 0) {
      csv = '';
    } else if (typeof data[0] === 'object') {
      const keys = Object.keys(data[0]);
      const rows = data.map((row) => keys.map((k) => {
        const val = row[k] == null ? '' : String(row[k]);
        // Escape double quotes
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','));
      csv = keys.join(',') + '\n' + rows.join('\n');
    } else {
      // array of primitives
      csv = data.join('\n');
    }
  } else if (typeof data === 'object') {
    // single object -> make single-row CSV
    const keys = Object.keys(data);
    const row = keys.map((k) => `"${String(data[k] ?? '').replace(/"/g, '""')}"`).join(',');
    csv = keys.join(',') + '\n' + row;
  } else {
    csv = String(data);
  }

  // Create blob and trigger download (only works in browser)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // not in browser
    // Optionally, could write to filesystem on server if needed
    console.warn('downloadCsv called outside browser environment');
    return;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Descarga un texto plano como un archivo PDF, repartiéndolo en páginas automáticamente.
export async function downloadPdf(text, filename = 'export.pdf') {
  if (typeof window === 'undefined') {
    console.warn('downloadPdf called outside browser environment');
    return;
  }

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const maxWidth = doc.internal.pageSize.width - margin * 2;
  const lineHeight = 14;
  const lines = doc.splitTextToSize(text, maxWidth);

  let cursorY = margin;
  lines.forEach((line) => {
    if (cursorY + lineHeight > doc.internal.pageSize.height - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  });

  doc.save(filename);
}

// Exporta el contenido visual de un elemento HTML a PDF usando jsPDF + html2canvas.
export async function downloadPdfFromElement(element, filename = 'export.pdf') {
  if (typeof window === 'undefined') {
    console.warn('downloadPdfFromElement called outside browser environment');
    return;
  }

  if (!element) {
    console.warn('downloadPdfFromElement: no element provided');
    return;
  }

  const { jsPDF } = await import('jspdf');
  // Use jsPDF's html renderer which relies on html2canvas for accurate
  // visual rendering. html2canvas must be installed in the project.
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Clone the element into an offscreen container so we can adjust
  // styles (make it compact) and ensure the full content (not only
  // the visible scroll area) is rendered.
  const cloneWrapper = document.createElement('div');
  cloneWrapper.style.position = 'absolute';
  cloneWrapper.style.top = '0';
  // Move the clone off-screen using transform so it's still renderable
  cloneWrapper.style.transform = 'translateX(-10000px)';
  cloneWrapper.style.background = 'white';
  // Ensure the clone can grow to full width of its content
  cloneWrapper.style.width = 'auto';

  const clone = element.cloneNode(true);

  // Reset scroll/overflow on clone and descendants
  const resetOverflow = (node) => {
    if (node && node.style) {
      node.style.overflow = 'visible';
      node.style.maxHeight = 'none';
    }
    Array.from(node.children || []).forEach(resetOverflow);
  };
  resetOverflow(clone);

  // Add a temporary compact stylesheet to reduce paddings and font-size
  // for a denser PDF layout. This only affects the cloned node during export.
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-pdf-export', '1');
  styleEl.textContent = `
    /* Compact export styles - only for PDF export */
    .pdf-export-compact * { box-sizing: border-box; }
    .pdf-export-compact { font-size: 10px !important; }
    .pdf-export-compact table { border-collapse: collapse !important; }
    .pdf-export-compact th, .pdf-export-compact td { padding: 4px 6px !important; }
    .pdf-export-compact .${'recordTimes'} { gap: 4px !important; }
  `;

  // Apply a class to the clone to scope compact rules
  clone.classList.add('pdf-export-compact');

  cloneWrapper.appendChild(clone);
  document.body.appendChild(styleEl);
  document.body.appendChild(cloneWrapper);

  // Ensure jsPDF/html2canvas can find html2canvas. Some jsPDF builds
  // expect html2canvas available on window. Import and attach it.
  try {
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default ?? html2canvasModule;
    // Attach to window for jsPDF.html if needed
    try {
      // eslint-disable-next-line no-undef
      window.html2canvas = html2canvas;
    } catch (e) {
      // ignore if window isn't writable
    }
  } catch (err) {
    // If html2canvas cannot be loaded, the export may fail; log and continue
    // so doc.html can attempt to resolve via its internal loader.
    // console.warn('Could not load html2canvas', err);
  }

  // Render with a higher scale for better quality; jsPDF will paginate
  // automatically when the rendered canvas is larger than a page.
  await new Promise((resolve, reject) => {
    try {
      doc.html(cloneWrapper, {
        x: 10,
        y: 10,
        html2canvas: { scale: 2, useCORS: true },
        callback: (docInstance) => {
          try {
            docInstance.save(filename);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
      });
    } catch (err) {
      reject(err);
    }
  });

  // Cleanup
  try {
    if (cloneWrapper.parentNode) cloneWrapper.parentNode.removeChild(cloneWrapper);
    if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
  } catch (e) {
    // ignore cleanup errors
  }
}

// Variante de exportación que captura un elemento como imagen y la convierte en PDF paginado.
export async function downloadPdfFromElementImage(element, filename = 'export.pdf') {
  if (typeof window === 'undefined') return;
  if (!element) return;

  const { jsPDF } = await import('jspdf');
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default ?? html2canvasModule;

  // Clone element to avoid modifying original
  const cloneWrapper = document.createElement('div');
  cloneWrapper.style.position = 'absolute';
  cloneWrapper.style.top = '0';
  cloneWrapper.style.transform = 'translateX(-10000px)';
  cloneWrapper.style.background = 'white';
  cloneWrapper.style.width = 'auto';

  const clone = element.cloneNode(true);
  const resetOverflow = (node) => {
    if (node && node.style) {
      node.style.overflow = 'visible';
      node.style.maxHeight = 'none';
    }
    Array.from(node.children || []).forEach(resetOverflow);
  };
  resetOverflow(clone);

  cloneWrapper.appendChild(clone);
  document.body.appendChild(cloneWrapper);

  // Optional compact style: hide the department column (keep its space),
  // make other cells have transparent background, and style department headers.
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-pdf-export-img', '1');
  styleEl.textContent = `
    .pdf-export-compact * { box-sizing: border-box; }
    .pdf-export-compact { font-size: 10px !important; }
    .pdf-export-compact table { border-collapse: collapse !important; }
    .pdf-export-compact th, .pdf-export-compact td { padding: 4px 6px !important; background: transparent !important; }
    /* Hide department column content but preserve column width */
    .pdf-export-compact td:nth-child(2), .pdf-export-compact th:nth-child(2) { visibility: hidden !important; }
    /* Department header rows keep a visible background */
    .pdf-dept-header td { visibility: visible !important; background: #f3f6f5 !important; font-weight: 700 !important; }
  `;
  clone.classList.add('pdf-export-compact');
  document.body.appendChild(styleEl);

  try {
    const scale = 2;
    const canvas = await html2canvas(cloneWrapper, { scale, useCORS: true, logging: false });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    // Calculate image dimensions in PDF points
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(filename);
    } else {
      // Slice canvas vertically into pages
      const pageCanvasHeight = Math.floor((canvas.width * (pageHeight - margin * 2)) / imgWidth);
      let y = 0;
      while (y < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - y);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const sliceData = sliceCanvas.toDataURL('image/png', 1.0);
        const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
        if (y > 0) pdf.addPage();
        pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceImgHeight);
        y += sliceHeight;
      }
      pdf.save(filename);
    }
  } finally {
    try { if (cloneWrapper.parentNode) cloneWrapper.parentNode.removeChild(cloneWrapper); } catch (e) {}
    try { if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl); } catch (e) {}
  }
}

// Genera un PDF agrupando las filas del elemento exportado por departamento antes de renderizar la imagen.
export async function downloadPdfGroupedByDepartmentImage(element, filename = 'export.pdf') {
  if (typeof window === 'undefined') return;
  if (!element) return;

  const { jsPDF } = await import('jspdf');
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default ?? html2canvasModule;

  // Clone element to avoid modifying original
  const cloneWrapper = document.createElement('div');
  cloneWrapper.style.position = 'absolute';
  cloneWrapper.style.top = '0';
  cloneWrapper.style.transform = 'translateX(-10000px)';
  cloneWrapper.style.background = 'white';
  cloneWrapper.style.width = 'auto';

  const clone = element.cloneNode(true);
  const resetOverflow = (node) => {
    if (node && node.style) {
      node.style.overflow = 'visible';
      node.style.maxHeight = 'none';
    }
    Array.from(node.children || []).forEach(resetOverflow);
  };
  resetOverflow(clone);

  // Find the table inside the clone and regroup rows by department
  const table = clone.querySelector('table');
  if (table) {
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (tbody) {
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const deptMap = new Map();
      const deptOrder = [];

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td, th');
        // department is expected in the second column (index 1)
        const deptCell = cells[1];
        const dept = deptCell ? String(deptCell.textContent || '').trim() : 'Sin departamento';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, []);
          deptOrder.push(dept);
        }
        deptMap.get(dept).push(row);
      });

      // Order departments alphabetically
      deptOrder.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

      // Rebuild tbody: for each department, insert a department header row, then its rows
      tbody.innerHTML = '';
      const colCount = thead ? thead.querySelectorAll('th').length : (table.querySelectorAll('th').length || 6);
      deptOrder.forEach((dept) => {
        const headerRow = document.createElement('tr');
        headerRow.classList.add('pdf-dept-header');
        const headerCell = document.createElement('td');
        headerCell.colSpan = Math.max(colCount - 1, 1);
        headerCell.textContent = dept || 'Sin departamento';
        headerCell.style.fontWeight = '700';
        headerCell.style.background = '#c1f2ea';
        headerCell.style.padding = '6px 8px';
        headerCell.style.border = '1px solid rgba(0,0,0,0.12)';
        headerRow.appendChild(headerCell);
        tbody.appendChild(headerRow);

        const rowsForDept = deptMap.get(dept) || [];
        rowsForDept.forEach((r) => tbody.appendChild(r));
      });
    }
  }

  cloneWrapper.appendChild(clone);
  document.body.appendChild(cloneWrapper);

  // Optional compact style
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-pdf-export-img', '1');
  styleEl.textContent = `
    .pdf-export-compact * { box-sizing: border-box; }
    .pdf-export-compact { font-size: 10px !important; }
    .pdf-export-compact table { border-collapse: collapse !important; width: 100% !important; }
    .pdf-export-compact th, .pdf-export-compact td { padding: 4px 6px !important; background: transparent !important; border: 1px solid rgba(0,0,0,0.12) !important; }
    .pdf-export-compact td:nth-child(2), .pdf-export-compact th:nth-child(2) { display: none !important; }
    .pdf-dept-header td { background: #c1f2ea !important; }
  `;
  clone.classList.add('pdf-export-compact');
  document.body.appendChild(styleEl);

  try {
    const scale = 2;
    const canvas = await html2canvas(cloneWrapper, { scale, useCORS: true, logging: false });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    // Calculate image dimensions in PDF points
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(filename);
    } else {
      // Slice canvas vertically into pages
      const pageCanvasHeight = Math.floor((canvas.width * (pageHeight - margin * 2)) / imgWidth);
      let y = 0;
      while (y < canvas.height) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - y);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const sliceData = sliceCanvas.toDataURL('image/png', 1.0);
        const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
        if (y > 0) pdf.addPage();
        pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceImgHeight);
        y += sliceHeight;
      }
      pdf.save(filename);
    }
  } finally {
    try { if (cloneWrapper.parentNode) cloneWrapper.parentNode.removeChild(cloneWrapper); } catch (e) {}
    try { if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl); } catch (e) {}
  }
}

// Convierte los datos del resumen en un archivo XLSX con estilos básicos y leyendas de color.
export async function downloadXlsx(data, filename = 'export.xlsx') {
  if (typeof window === 'undefined') {
    console.warn('downloadXlsx called outside browser environment');
    return;
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Resumen');
  const rows = Array.isArray(data) ? data : [data];
  const isSummary = rows.some((row) => row && ('first_entry' in row || 'record_times' in row));

  const colors = {
    teal: 'FF36BBA7',
    dark: 'FF1E293B',
    muted: 'FF475569',
    border: 'FFE2E8F0',
    early: 'FF548DD2',
    late: 'FFDC2626',
    green: 'FF16A34A',
    internal: 'FF16A34A',
    external: 'FF548DD2',
    absent: 'FFB45309',
    stripe: 'FFFAFCFE',
  };

  const parseMinutes = (value) => {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const formatTime = (value) => {
    if (!value) return 'Sin registro';
    const match = String(value).match(/(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : String(value);
  };
  const styleBorders = (row) => row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: colors.border } },
      left: { style: 'thin', color: { argb: colors.border } },
      bottom: { style: 'thin', color: { argb: colors.border } },
      right: { style: 'thin', color: { argb: colors.border } },
    };
  });

  const isDateRange = isSummary && rows.some((row) => row && 'authDate' in row);

  if (isDateRange) {
    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 14 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Departamento', key: 'department', width: 24 },
      { header: 'Cargo', key: 'position', width: 22 },
      { header: 'Primer ingreso', key: 'entry', width: 18 },
      { header: 'Ultimo egreso', key: 'exit', width: 18 },
      { header: 'Registros por equipo', key: 'records', width: 42 },
    ];
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.teal } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 24;

    rows.filter(Boolean).forEach((item, index) => {
      const row = worksheet.addRow({
        date: item.authDate || '-',
        name: item.personName || item.employeedID || '-',
        department: item.department_name || 'Sin departamento',
        position: item.position_name || 'Sin cargo',
        entry: formatTime(item.first_entry),
        exit: formatTime(item.last_exit),
        records: '',
      });
      row.alignment = { vertical: 'middle', wrapText: true };
      row.height = 24;
      if (index % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.stripe } };
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).font = { bold: true, color: { argb: colors.dark } };
      row.getCell(3).font = { color: { argb: colors.muted } };
      row.getCell(4).font = { color: { argb: colors.muted } };
      const entryMinutes = parseMinutes(item.first_entry);
      const exitMinutes = parseMinutes(item.last_exit);
      row.getCell(5).font = { bold: true, color: { argb: entryMinutes === null ? colors.muted : entryMinutes > 425 ? colors.late : colors.early } };
      row.getCell(6).font = { bold: true, color: { argb: exitMinutes === null ? colors.muted : exitMinutes < 985 ? colors.late : colors.green } };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

      const records = String(item.record_times || '')
        .split('||')
        .map((record) => {
          const [time, device] = record.split('|');
          return { time: time?.trim(), device: device?.trim().toUpperCase() };
        })
        .filter((record) => record.time && (record.device === 'INTERNO' || record.device === 'EXTERNO'));
      row.getCell(7).value = records.length > 0
        ? { richText: records.flatMap((record, recordIndex) => [
          ...(recordIndex > 0 ? [{ text: '  |  ', font: { color: { argb: colors.muted } } }] : []),
          { text: `${record.time} (${record.device})`, font: { color: { argb: record.device === 'INTERNO' ? colors.internal : colors.external }, bold: true } },
        ]) }
        : 'Sin registros';
      row.getCell(7).font = { size: 10 };
      styleBorders(row);
    });

    worksheet.addRow([]);
    const legendRow = worksheet.addRow(['Colores:', 'Ingreso temprano', 'Ingreso tardio', 'Salida antes de 16:25', 'Salida despues de 16:25', 'INTERNO', 'EXTERNO']);
    legendRow.font = { bold: true, color: { argb: colors.dark } };
    [colors.early, colors.late, colors.late, colors.green, colors.internal, colors.external].forEach((color, index) => {
      legendRow.getCell(index + 2).font = { bold: true, color: { argb: color } };
    });
  } else if (isSummary) {
    worksheet.columns = [
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Departamento', key: 'department', width: 24 },
      { header: 'Cargo', key: 'position', width: 22 },
      { header: 'Primer ingreso', key: 'entry', width: 18 },
      { header: 'Ultimo egreso', key: 'exit', width: 18 },
      { header: 'Novedad', key: 'absence', width: 28 },
      { header: 'Registros por equipo', key: 'records', width: 42 },
    ];
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.teal } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 24;

    rows.filter(Boolean).forEach((item, index) => {
      const row = worksheet.addRow({
        name: item.personName || '-',
        department: item.department_name || 'Sin departamento',
        position: item.position_name || 'Sin cargo',
        entry: formatTime(item.first_entry),
        exit: formatTime(item.last_exit),
        absence: item.absence_reason || 'Sin novedad',
        records: '',
      });
      row.alignment = { vertical: 'middle', wrapText: true };
      row.height = 24;
      if (index % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.stripe } };
      row.getCell(1).font = { bold: true, color: { argb: colors.dark } };
      row.getCell(2).font = { color: { argb: colors.muted } };
      row.getCell(3).font = { color: { argb: colors.muted } };
      row.getCell(4).font = {
        bold: true,
        color: { argb: parseMinutes(item.first_entry) === null ? colors.muted : parseMinutes(item.first_entry) > 425 ? colors.late : colors.early },
      };
      row.getCell(5).font = {
        bold: true,
        color: { argb: parseMinutes(item.last_exit) === null ? colors.muted : parseMinutes(item.last_exit) < 985 ? colors.late : colors.green },
      };
      if (item.absence_reason) row.getCell(6).font = { bold: true, color: { argb: colors.absent } };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

      const records = String(item.record_times || '')
        .split('||')
        .map((record) => {
          const [time, device] = record.split('|');
          return { time: time?.trim(), device: device?.trim().toUpperCase() };
        })
        .filter((record) => record.time && (record.device === 'INTERNO' || record.device === 'EXTERNO'));
      const deviceColor = (device) => ({
        INTERNO: colors.internal,
        EXTERNO: colors.external,
      }[device] || colors.muted);
      row.getCell(7).value = records.length > 0
        ? { richText: records.flatMap((record, recordIndex) => [
          ...(recordIndex > 0 ? [{ text: '  |  ', font: { color: { argb: colors.muted } } }] : []),
          { text: `${record.time} (${record.device})`, font: { color: { argb: deviceColor(record.device) }, bold: true } },
        ]) }
        : 'Sin registros';
      row.getCell(7).font = { size: 10 };
      styleBorders(row);
    });

    const legend = worksheet.addRow([]);
    worksheet.addRow(['Colores:', 'Ingreso temprano', 'Ingreso tardio', 'Salida antes de 16:25', 'Salida despues de 16:25', 'INTERNO', 'EXTERNO']);
    const legendRow = worksheet.lastRow;
    legendRow.font = { bold: true, color: { argb: colors.dark } };
    [colors.early, colors.late, colors.late, colors.green, colors.internal, colors.external].forEach((color, index) => {
      legendRow.getCell(index + 2).font = { bold: true, color: { argb: color } };
    });
    legend.height = 6;
  } else {
    const keys = Object.keys(rows[0] || {});
    const headerRow = worksheet.addRow(keys);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.teal } };
    rows.forEach((item) => worksheet.addRow(keys.map((key) => item?.[key] ?? '')));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Exporta el resumen por rango de fechas como PDF con una tabla visual y formato de asistencia.
export async function downloadDateRangePdf(data, filename = 'date-range.pdf') {
  if (typeof window === 'undefined') return;

  const rows = Array.isArray(data) ? data : [];
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'background:#fff;padding:18px;width:1100px;color:#102a43;font-family:Arial,sans-serif;';
  const title = document.createElement('h2');
  title.textContent = 'Resumen por rango de fechas';
  title.style.cssText = 'color:#1e293b;margin:0 0 14px;font-size:18px;';
  wrapper.appendChild(title);

  const table = document.createElement('table');
  table.style.cssText = 'border-collapse:collapse;width:100%;font-size:11px;';
  const headers = ['Fecha', 'Nombre', 'Departamento', 'Cargo', 'Primer ingreso', 'Ultimo egreso', 'Registros por equipo'];
  const headerRow = table.insertRow();
  headers.forEach((header) => {
    const cell = headerRow.insertCell();
    cell.textContent = header;
    cell.style.cssText = 'background:#36BBA7;color:#fff;font-weight:bold;padding:8px;border:1px solid #2EA295;text-align:center;';
  });
  const timeMinutes = (value) => {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const timeText = (value) => {
    const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : 'Sin registro';
  };
  const recordsText = (value) => String(value || '').split('||').map((record) => {
    const [time, device] = record.split('|');
    return time && (device === 'INTERNO' || device === 'EXTERNO') ? `${time} (${device})` : null;
  }).filter(Boolean).join('  |  ') || 'Sin registros';
  rows.filter(Boolean).forEach((item, index) => {
    const cells = [item.authDate || '-', item.personName || item.employeedID || '-', item.department_name || 'Sin departamento', item.position_name || 'Sin cargo', timeText(item.first_entry), timeText(item.last_exit), recordsText(item.record_times)];
    const row = table.insertRow();
    cells.forEach((value, cellIndex) => {
      const cell = row.insertCell();
      cell.textContent = value;
      cell.style.cssText = `padding:7px;border:1px solid #e2e8f0;vertical-align:middle;${index % 2 === 0 ? 'background:#fafcfe;' : ''}`;
      if (cellIndex === 4) cell.style.color = timeMinutes(item.first_entry) === null ? '#475569' : timeMinutes(item.first_entry) > 425 ? '#dc2626' : '#548dd2';
      if (cellIndex === 5) cell.style.color = timeMinutes(item.last_exit) === null ? '#475569' : timeMinutes(item.last_exit) < 985 ? '#dc2626' : '#16a34a';
      if (cellIndex === 6) cell.style.color = '#16a34a';
      if (cellIndex === 1) cell.style.fontWeight = 'bold';
    });
  });
  wrapper.appendChild(table);
  document.body.appendChild(wrapper);
  try {
    await downloadPdfFromElementImage(wrapper, filename);
  } finally {
    wrapper.remove();
  }
}

// Genera un PDF directo para rangos de fechas con cabecera, columnas y color por tiempos de entrada/salida.
export async function downloadDateRangePdfDirect(data, filename = 'date-range.pdf', dateRange = {}) {
  if (typeof window === 'undefined') return;

  const rows = Array.isArray(data) ? data : [];
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 24;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const fromDate = dateRange.fromDate || rows[0]?.authDate || '-';
  const toDate = dateRange.toDate || rows[rows.length - 1]?.authDate || '-';
  const footerHeight = 42;
  const columns = [
    { title: 'Fecha', width: 58 },
    { title: 'Departamento', width: 86 },
    { title: 'Cargo', width: 126 },
    { title: 'Ingreso', width: 58 },
    { title: 'Salida', width: 58 },
    { title: 'Registros', width: pageWidth - margin * 2 - 386 },
  ];
  const colors = { teal: [54, 187, 167], dark: [30, 41, 59], muted: [71, 85, 105], early: [84, 141, 210], late: [220, 38, 38], green: [22, 163, 74], internal: [22, 163, 74], external: [84, 141, 210], stripe: [250, 252, 254], border: [226, 232, 240] };
  const parseMinutes = (value) => {
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
      if (!time || (device !== 'INTERNO' && device !== 'EXTERNO')) return null;
      const normalizedTime = time.trim();
      const normalizedDevice = device.trim().toUpperCase();
      const key = `${normalizedTime}|${normalizedDevice}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return { time: normalizedTime, device: normalizedDevice };
    }).filter(Boolean);
  };
  const drawHeader = () => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.setTextColor(...colors.teal);
    pdf.text('RESUMEN DE ASISTENCIA', margin, 27);
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.dark);
    pdf.text('Consulta por rango de fechas', margin, 39);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    pdf.text(`Periodo seleccionado: ${fromDate} al ${toDate}`, pageWidth - margin, 32, { align: 'right' });
    pdf.setDrawColor(...colors.teal);
    pdf.setLineWidth(1.5);
    pdf.line(margin, 48, pageWidth - margin, 48);
    let x = margin;
    const y = 54;
    pdf.setFontSize(8);
    columns.forEach((column) => {
      pdf.setFillColor(...colors.teal);
      pdf.rect(x, y, column.width, 22, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(column.title, x + 4, y + 14);
      x += column.width;
    });
    return y + 22;
  };

  const drawEmployeeName = (name, department, position, currentY) => {
    const employeeName = `${name || 'Colaborador'}${department ? ` - ${department}` : ''}${position ? ` - ${position}` : ''}`;
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(...colors.border);
    pdf.rect(margin, currentY, pageWidth - margin * 2, 18, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.dark);
    pdf.text(employeeName, margin + 5, currentY + 12);
    return currentY + 18;
  };

  const drawFooter = () => {
    const pageCount = pdf.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      pdf.setPage(pageNumber);
      const footerY = pageHeight - footerHeight;
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY, pageWidth - margin, footerY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.dark);
      pdf.text('Guia de lectura', margin, footerY + 11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.muted);
      pdf.text('Ingreso: azul temprano (hasta 07:05) | rojo tardio (despues de 07:05)', margin, footerY + 21);
      pdf.text('Salida: rojo antes de 16:25 | verde despues de 16:25', margin, footerY + 31);
      let legendX = pageWidth - margin - 185;
      pdf.setTextColor(...colors.external);
      pdf.text('Hora EXTERNO', legendX, footerY + 11);
      legendX += 67;
      pdf.setTextColor(...colors.internal);
      pdf.text('Hora INTERNO', legendX, footerY + 11);
      pdf.setTextColor(...colors.muted);
      pdf.text(`Pagina ${pageNumber} de ${pageCount}`, pageWidth - margin, footerY + 31, { align: 'right' });
    }
  };

  let y = drawHeader();
  const employeeGroups = new Map();
  rows.filter(Boolean).forEach((item) => {
    const key = String(item.employeedID || item.personName || 'colaborador');
    if (!employeeGroups.has(key)) employeeGroups.set(key, []);
    employeeGroups.get(key).push(item);
  });

  employeeGroups.forEach((employeeRows) => {
    const employee = employeeRows[0];
    if (y + 40 > pageHeight - margin - footerHeight) {
      pdf.addPage();
      y = drawHeader();
    }
    y = drawEmployeeName(employee.personName, employee.department_name, employee.position_name, y);

    employeeRows.forEach((item, index) => {
      const entryMinutes = parseMinutes(item.first_entry);
      const exitMinutes = parseMinutes(item.last_exit);
      const records = parseRecords(item.record_times);
      const values = [item.authDate || '-', item.department_name || 'Sin departamento', item.position_name || 'Sin cargo', timeText(item.first_entry), timeText(item.last_exit), records.map((record) => record.time).join('  |  ') || 'Sin registros'];
      const wrapped = values.map((value, cellIndex) => pdf.splitTextToSize(String(value), columns[cellIndex].width - 8));
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const recordLines = [];
      let currentRecordLine = [];
      let currentRecordWidth = 0;
      records.forEach((record) => {
        const separatorWidth = currentRecordLine.length > 0 ? pdf.getTextWidth(' | ') : 0;
        const recordWidth = pdf.getTextWidth(record.time);
        if (currentRecordLine.length > 0 && currentRecordWidth + separatorWidth + recordWidth > columns[5].width - 8) {
          recordLines.push(currentRecordLine);
          currentRecordLine = [];
          currentRecordWidth = 0;
        }
        currentRecordLine.push(record);
        currentRecordWidth += (currentRecordLine.length > 1 ? pdf.getTextWidth(' | ') : 0) + recordWidth;
      });
      if (currentRecordLine.length > 0) recordLines.push(currentRecordLine);
      if (recordLines.length === 0) recordLines.push([]);
      const rowHeight = Math.max(18, ...wrapped.map((lines) => lines.length * 9 + 6), recordLines.length * 9 + 6);
      if (y + rowHeight > pageHeight - margin - footerHeight) {
        pdf.addPage();
        y = drawHeader();
        y = drawEmployeeName(employee.personName, employee.department_name, employee.position_name, y);
      }
      let x = margin;
      columns.forEach((column, cellIndex) => {
        if (index % 2 === 0) {
          pdf.setFillColor(...colors.stripe);
          pdf.rect(x, y, column.width, rowHeight, 'F');
        }
        pdf.setDrawColor(...colors.border);
        pdf.rect(x, y, column.width, rowHeight);
        const color = cellIndex === 3
          ? (entryMinutes === null ? colors.muted : entryMinutes > 425 ? colors.late : colors.early)
          : cellIndex === 4
            ? (exitMinutes === null ? colors.muted : exitMinutes < 985 ? colors.late : colors.green)
            : colors.dark;
        if (cellIndex === 5 && records.length > 0) {
          recordLines.forEach((line, lineIndex) => {
            let recordX = x + 4;
            line.forEach((record, recordIndex) => {
              if (recordIndex > 0) {
                pdf.setTextColor(...colors.muted);
                pdf.text(' | ', recordX, y + 12 + lineIndex * 9);
                recordX += pdf.getTextWidth(' | ');
              }
              pdf.setTextColor(...(record.device === 'INTERNO' ? colors.internal : colors.external));
              pdf.text(record.time, recordX, y + 12 + lineIndex * 9);
              recordX += pdf.getTextWidth(record.time);
            });
          });
          x += column.width;
          return;
        }
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', cellIndex === 3 || cellIndex === 4 ? 'bold' : 'normal');
        pdf.setFontSize(8);
        wrapped[cellIndex].forEach((line, lineIndex) => pdf.text(line, x + 4, y + 12 + lineIndex * 9));
        x += column.width;
      });
      y += rowHeight;
    });
  });

  drawFooter();
  pdf.save(filename);
}

// Descarga el resumen diario en PDF usando una tabla simple y coloreando tiempos según el criterio del negocio.
export async function downloadSummaryPdfDirect(data, filename = 'summary.pdf', date = '-') {
  if (typeof window === 'undefined') return;
  const rows = Array.isArray(data) ? data : [];
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 24;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const footerHeight = 42;
  const columns = [
    { title: 'Nombre', width: 116 },
    { title: 'Departamento', width: 84 },
    { title: 'Cargo', width: 120 },
    { title: 'Ingreso', width: 58 },
    { title: 'Salida', width: 58 },
    { title: 'Registros', width: pageWidth - margin * 2 - 436 },
  ];
  const colors = { teal: [54, 187, 167], dark: [30, 41, 59], muted: [71, 85, 105], early: [84, 141, 210], late: [220, 38, 38], green: [22, 163, 74], border: [226, 232, 240], stripe: [250, 252, 254] };
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
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.setTextColor(...colors.teal);
    pdf.text('RESUMEN DE ASISTENCIA', margin, 27);
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.dark);
    pdf.text('Resumen diario por colaborador', margin, 39);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    pdf.text(`Fecha consultada: ${date}`, pageWidth - margin, 32, { align: 'right' });
    pdf.setDrawColor(...colors.teal);
    pdf.setLineWidth(1.5);
    pdf.line(margin, 48, pageWidth - margin, 48);
    let x = margin;
    columns.forEach((column) => {
      pdf.setFillColor(...colors.teal);
      pdf.rect(x, 54, column.width, 22, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text(column.title, x + 4, 68);
      x += column.width;
    });
    return 76;
  };
  const drawFooter = () => {
    for (let pageNumber = 1; pageNumber <= pdf.getNumberOfPages(); pageNumber += 1) {
      pdf.setPage(pageNumber);
      const footerY = pageHeight - footerHeight;
      pdf.setDrawColor(...colors.border);
      pdf.line(margin, footerY, pageWidth - margin, footerY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.dark);
      pdf.text('Guia de lectura', margin, footerY + 11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.muted);
      pdf.text('Ingreso: azul hasta 07:05 | rojo despues de 07:05 | Salida: rojo antes de 16:25 | verde despues', margin, footerY + 21);
      pdf.text('Registros: horas azules corresponden a EXTERNO y horas verdes corresponden a INTERNO', margin, footerY + 31);
      pdf.setTextColor(...colors.muted);
      pdf.text(`Pagina ${pageNumber} de ${pdf.getNumberOfPages()}`, pageWidth - margin, footerY + 31, { align: 'right' });
    }
  };

  let y = drawHeader();
  rows.forEach((item, index) => {
    const values = [item.personName || '-', item.department_name || 'Sin departamento', item.position_name || 'Sin cargo', timeText(item.first_entry), timeText(item.last_exit)];
    const records = parseRecords(item.record_times);
    const recordText = records.map((record) => record.time).join(' | ') || 'Sin registros';
    const wrapped = [...values, recordText].map((value, cellIndex) => pdf.splitTextToSize(String(value), columns[cellIndex].width - 8));
    const rowHeight = Math.max(18, ...wrapped.map((lines) => lines.length * 9 + 6));
    if (y + rowHeight > pageHeight - margin - footerHeight) {
      pdf.addPage();
      y = drawHeader();
    }
    let x = margin;
    columns.forEach((column, cellIndex) => {
      if (index % 2 === 0) {
        pdf.setFillColor(...colors.stripe);
        pdf.rect(x, y, column.width, rowHeight, 'F');
      }
      pdf.setDrawColor(...colors.border);
      pdf.rect(x, y, column.width, rowHeight);
      if (cellIndex === 5 && records.length > 0) {
        let recordX = x + 4;
        records.forEach((record, recordIndex) => {
          if (recordIndex > 0) {
            pdf.setTextColor(...colors.muted);
            pdf.text(' | ', recordX, y + 12);
            recordX += pdf.getTextWidth(' | ');
          }
          pdf.setTextColor(...(record.device === 'INTERNO' ? colors.green : colors.early));
          pdf.setFont('helvetica', 'bold');
          pdf.text(record.time, recordX, y + 12);
          recordX += pdf.getTextWidth(record.time);
        });
      } else {
        const entryMinutes = timeMinutes(item.first_entry);
        const exitMinutes = timeMinutes(item.last_exit);
        const color = cellIndex === 3 ? (entryMinutes === null ? colors.muted : entryMinutes > 425 ? colors.late : colors.early) : cellIndex === 4 ? (exitMinutes === null ? colors.muted : exitMinutes < 985 ? colors.late : colors.green) : colors.dark;
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', cellIndex === 0 || cellIndex === 3 || cellIndex === 4 ? 'bold' : 'normal');
        pdf.setFontSize(8);
        wrapped[cellIndex].forEach((line, lineIndex) => pdf.text(line, x + 4, y + 12 + lineIndex * 9));
      }
      x += column.width;
    });
    y += rowHeight;
  });
  drawFooter();
  pdf.save(filename);
}

// Exporta el resumen diario agrupado por departamento, manteniendo columnas clave y registros por colaborador.
export async function downloadSummaryPdfDirectGrouped(data, filename = 'summary.pdf', date = '-') {
  if (typeof window === 'undefined') return;
  const rows = Array.isArray(data) ? data : [];
  const { jsPDF } = await import('jspdf');
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
  const colors = { teal: [54, 187, 167], header: [148, 163, 184], headerDark: [100, 116, 139], dark: [71, 85, 105], muted: [100, 116, 139], soft: [180, 187, 198], early: [105, 158, 219], late: [221, 112, 112], green: [91, 176, 119], amber: [190, 133, 57], internal: [145, 195, 160], external: [145, 180, 225], border: [203, 213, 225], stripe: [250, 252, 254], department: [226, 232, 240] };
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
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.setTextColor(...colors.headerDark);
    pdf.text('RESUMEN DE ASISTENCIA', margin, 23);
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.dark);
    pdf.text('Resumen diario organizado por departamento', margin, 35);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    pdf.text(`Fecha consultada: ${date}`, pageWidth - margin, 32, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.dark);
    pdf.text('Guia de lectura', margin, 47);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.muted);
    pdf.text('Ingreso: azul hasta 07:05 | rojo despues de 07:05 | Salida: rojo antes de 16:25 | verde despues', margin, 56);
    pdf.text('Registros: azul = MARCACIÓN EQUIPO EXTERNO | verde = MARCACIÓN EQUIPO INTERNO.', margin, 65);
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.6);
    pdf.line(margin, 73, pageWidth - margin, 73);
    let x = margin;
    columns.forEach((column) => {
      pdf.setFillColor(...colors.header);
      pdf.setLineWidth(0.25);
      pdf.rect(x, 79, column.width, 22, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text(column.title, x + 4, 93);
      x += column.width;
    });
    return 101;
  };
  const drawGuide = () => {
    const footerY = pageHeight - footerHeight;
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...colors.muted);
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
    if (y + 38 > pageHeight - margin - footerHeight) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFillColor(...colors.department);
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.25);
    pdf.rect(margin, y, pageWidth - margin * 2, 17, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.dark);
    pdf.text(`${department} (${departmentRows.length})`, margin + 5, y + 11);
    y += 17;

    departmentRows.forEach((item) => {
      const records = parseRecords(item.record_times);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      const recordLines = [];
      let line = [];
      let lineWidth = 0;
      const recordGap = 4;
      const recordPadding = 8;
      const recordHeight = 14;
      records.forEach((record) => {
        const recordWidth = pdf.getTextWidth(record.time) + recordPadding;
        if (line.length && lineWidth + recordGap + recordWidth > columns[5].width - 8) {
          recordLines.push(line);
          line = [];
          lineWidth = 0;
        }
        line.push(record);
        lineWidth += (line.length > 1 ? recordGap : 0) + recordWidth;
      });
      if (line.length) recordLines.push(line);
      if (!recordLines.length) recordLines.push([]);
      const values = [item.personName || '-', item.position_name || 'Sin cargo', timeText(item.first_entry), timeText(item.last_exit), item.absence_reason || 'Sin novedad', records.map((record) => record.time).join(' | ') || 'Sin registros'];
      pdf.setFont('helvetica', 'normal');
      const wrapped = values.map((value, index) => pdf.splitTextToSize(String(value), columns[index].width - 8));
      const rowHeight = Math.max(18, recordLines.length * recordHeight + 4, ...wrapped.map((lines) => lines.length * 9 + 6));
      if (y + rowHeight > pageHeight - margin - footerHeight) {
        pdf.addPage();
        y = margin;
        pdf.setFillColor(...colors.department);
        pdf.rect(margin, y, pageWidth - margin * 2, 17, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.dark);
        pdf.text(`${department} (continua)`, margin + 5, y + 11);
        y += 17;
      }
      let x = margin;
      columns.forEach((column, cellIndex) => {
        if (stripeIndex % 2 === 0) {
          pdf.setFillColor(...colors.stripe);
          pdf.rect(x, y, column.width, rowHeight, 'F');
        }
        pdf.setDrawColor(...colors.border);
        pdf.setLineWidth(0.25);
        pdf.rect(x, y, column.width, rowHeight);
        if (cellIndex === 5 && records.length) {
          recordLines.forEach((recordLine, lineIndex) => {
            let recordX = x + 4;
            recordLine.forEach((record, recordIndex) => {
              if (recordIndex) recordX += recordGap;
              pdf.setDrawColor(...(record.device === 'INTERNO' ? colors.internal : colors.external));
              pdf.setLineWidth(0.6);
              pdf.setFont('helvetica', 'normal');
              const chipWidth = pdf.getTextWidth(record.time) + recordPadding;
              const chipY = y + 2 + lineIndex * recordHeight;
              pdf.roundedRect(recordX, chipY, chipWidth, 11, 5.5, 5.5, 'S');
              pdf.setTextColor(...colors.dark);
              pdf.text(record.time, recordX + recordPadding / 2, y + 10 + lineIndex * recordHeight);
              recordX += chipWidth;
            });
          });
        } else {
          const entryMinutes = timeMinutes(item.first_entry);
          const exitMinutes = timeMinutes(item.last_exit);
          const color = cellIndex === 2 ? (entryMinutes === null ? colors.soft : entryMinutes > 425 ? colors.late : colors.early) : cellIndex === 3 ? (exitMinutes === null ? colors.soft : exitMinutes < 985 ? colors.late : colors.green) : cellIndex === 4 ? (item.absence_reason ? (records.length ? colors.soft : colors.amber) : colors.soft) : cellIndex === 5 ? colors.soft : colors.dark;
          pdf.setTextColor(...color);
          pdf.setFont('helvetica', cellIndex === 0 ? 'bold' : 'normal');
          pdf.setFontSize(7.5);
          wrapped[cellIndex].forEach((textLine, lineIndex) => pdf.text(textLine, x + 4, y + 12 + lineIndex * 9));
        }
        x += column.width;
      });
      y += rowHeight;
      stripeIndex += 1;
    });
    y += 12;
  });
  if (y + footerHeight > pageHeight - margin) {
    pdf.addPage();
  }
  drawGuide();
  pdf.save(filename);
}
