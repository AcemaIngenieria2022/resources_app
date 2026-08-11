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
