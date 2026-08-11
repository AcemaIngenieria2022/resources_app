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

      // Rebuild tbody: for each department, insert a department header row, then its rows
      tbody.innerHTML = '';
      const colCount = thead ? thead.querySelectorAll('th').length : (table.querySelectorAll('th').length || 6);
      deptOrder.forEach((dept) => {
        const headerRow = document.createElement('tr');
        headerRow.classList.add('pdf-dept-header');
        const headerCell = document.createElement('td');
        headerCell.colSpan = colCount;
        headerCell.textContent = dept || 'Sin departamento';
        headerCell.style.fontWeight = '700';
        headerCell.style.background = '#e6fff7';
        headerCell.style.padding = '6px 8px';
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
    .pdf-export-compact table { border-collapse: collapse !important; }
    .pdf-export-compact th, .pdf-export-compact td { padding: 4px 6px !important; background: transparent !important; }
    .pdf-export-compact td:nth-child(2), .pdf-export-compact th:nth-child(2) { visibility: hidden !important; }
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

export async function downloadXlsx(data, filename = 'export.xlsx') {
  if (typeof window === 'undefined') {
    console.warn('downloadXlsx called outside browser environment');
    return;
  }

  const xlsxModule = await import('xlsx');
  const XLSX = xlsxModule.default ?? xlsxModule;
  let worksheet;
  if (typeof data === 'string') {
    worksheet = XLSX.utils.aoa_to_sheet([[data]]);
  } else if (Array.isArray(data)) {
    worksheet = XLSX.utils.json_to_sheet(data);
  } else if (typeof data === 'object') {
    worksheet = XLSX.utils.json_to_sheet([data]);
  } else {
    worksheet = XLSX.utils.aoa_to_sheet([[String(data)]]);
  }

  const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
  XLSX.writeFile(workbook, filename);
}
