/**
 * Shared ExcelJS plumbing behind every "Download Excel" button in the admin.
 *
 * ExcelJS itself is only ever imported inside `loadExcelJS`, so its bundle is
 * pulled in when an admin actually clicks a download button, not on every
 * page that offers one.
 */

const HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF6C4EE3" },
};
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } };

export async function loadExcelJS() {
  const imported = await import("exceljs");
  return imported.default;
}

function styleHeaderRow(sheet) {
  const row = sheet.getRow(1);
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle" };
  });
  row.height = 20;
}

/**
 * Adds one sheet to `workbook`.
 *
 * `columns`: [{ header, key, width, numFmt?, align? }] — `numFmt` is an Excel
 * number format string (e.g. "#,##0" for money), `align` is "left" | "right".
 */
export function addSheet(workbook, { name, columns, rows }) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns.map(({ header, key, width }) => ({ header, key, width }));
  sheet.addRows(rows);
  styleHeaderRow(sheet);

  columns.forEach(({ key, numFmt, align }) => {
    const column = sheet.getColumn(key);
    if (numFmt) column.numFmt = numFmt;
    if (align) column.alignment = { horizontal: align };
  });

  return sheet;
}

export async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * The common case behind every admin list's export button: one sheet, built
 * straight from rows the caller already fetched in full (see
 * `fetchAllPages`), styled header included.
 */
export async function exportRowsToExcel({ fileName, sheetName, columns, rows }) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ChoiceKraft Admin";
  workbook.created = new Date();

  addSheet(workbook, { name: sheetName, columns, rows });

  await downloadWorkbook(workbook, fileName);
}

/** "2026-09-22" for a file name — stable, sortable, no locale surprises. */
export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}
