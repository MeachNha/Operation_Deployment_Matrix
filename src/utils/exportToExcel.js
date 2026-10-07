import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Export data to a styled Excel file using ExcelJS.
 */
export async function exportToExcel(data, columns, fileName, options = {}) {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  const { title = '', subtitle = '', sheetName = 'Sheet1' } = options;

  // ─── 1. Create workbook and worksheet ──────────────────
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Operation Deployment Matrix';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);

  // ─── 2. Calculate column widths ────────────────────────
  const columnWidths = columns.map((col) => {
    const maxLen = Math.max(
      col.label.length,
      ...data.map((r) => String(r[col.key] ?? '').length)
    );
    return Math.min(maxLen + 3, 40);
  });

  // ─── 3. Define a reusable border object ────────────────
  //    NOTE: Use a DARKER gray (A0AEC0) so it's clearly visible
  const cellBorder = {
    top:    { style: 'thin', color: { argb: 'FFA0AEC0' } },
    bottom: { style: 'thin', color: { argb: 'FFA0AEC0' } },
    left:   { style: 'thin', color: { argb: 'FFA0AEC0' } },
    right:  { style: 'thin', color: { argb: 'FFA0AEC0' } },
  };

  const headerBorder = {
    top:    { style: 'medium', color: { argb: 'FF1A365D' } },
    bottom: { style: 'medium', color: { argb: 'FF1A365D' } },
    left:   { style: 'thin',   color: { argb: 'FF1A365D' } },
    right:  { style: 'thin',   color: { argb: 'FF1A365D' } },
  };

  // ─── 4. Add title and subtitle ─────────────────────────
  let currentRow = 1;

  if (title) {
    const titleRow = worksheet.getRow(currentRow);
    titleRow.getCell(1).value = title;
    titleRow.height = 26;
    titleRow.getCell(1).font = {
      name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1A365D' },
    };
    titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
    currentRow++;
  }

  if (subtitle) {
    const subtitleRow = worksheet.getRow(currentRow);
    subtitleRow.getCell(1).value = subtitle;
    subtitleRow.height = 20;
    subtitleRow.getCell(1).font = {
      name: 'Calibri', size: 11, italic: true, color: { argb: 'FF718096' },
    };
    subtitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
    currentRow++;
  }

  if (title || subtitle) {
    currentRow++; // spacer
  }

  // ─── 5. Add the header row ─────────────────────────────
  const headerRowNumber = currentRow;
  const headerRow = worksheet.getRow(headerRowNumber);

  columns.forEach((col, i) => {
    headerRow.getCell(i + 1).value = col.label;
  });
  headerRow.height = 30;

  // Style header cells
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > columns.length) return;   // ignore phantom cells
    cell.font = {
      name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C5282' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = headerBorder;
  });

  // ─── 6. Add data rows ──────────────────────────────────
  data.forEach((row, rowIndex) => {
    const dataRow = worksheet.getRow(headerRowNumber + 1 + rowIndex);
    const isEvenRow = rowIndex % 2 === 1;

    // IMPORTANT: set values FIRST, then styles
    columns.forEach((col, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      const value = row[col.key];
      // Replace null/undefined with empty string so cell exists
      cell.value = value === null || value === undefined ? '' : value;
    });

    dataRow.height = 22;

    // Now apply styles to ALL cells (including empties)
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > columns.length) return;   // ignore phantom cells

      const columnDef = columns[colNumber - 1];

      cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF2D3748' } };
      cell.alignment =
        columnDef?.align === 'center'
          ? { horizontal: 'center', vertical: 'middle' }
          : { horizontal: 'left', vertical: 'middle' };

      cell.border = cellBorder;

      // Zebra striping
      if (isEvenRow) {
        cell.fill = {
          type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });
  });

  // ─── 7. Apply column widths ────────────────────────────
  columns.forEach((col, i) => {
    worksheet.getColumn(i + 1).width = columnWidths[i];
  });

  // ─── 8. Freeze header row ──────────────────────────────
  worksheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: headerRowNumber,
      topLeftCell: `A${headerRowNumber + 1}`,
      activePane: 'bottomLeft',
    },
  ];

  // ─── 9. Auto-filter on header row ──────────────────────
  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to:   { row: headerRowNumber, column: columns.length },
  };

  // ─── 10. Generate and download ─────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `${fileName}_${timestamp}.xlsx`);
}