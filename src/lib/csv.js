// CSV export helpers (UTF-8 with BOM so Excel opens Kazakh/Russian text correctly).
export function toCsv(rows, columns) {
  const esc = (value) => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','));
  return [header, ...body].join('\r\n');
}

export function downloadCsv(filename, rows, columns) {
  const blob = new Blob(['﻿' + toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
