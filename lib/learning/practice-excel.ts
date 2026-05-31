import ExcelJS from "exceljs";
import type { PracticeTask } from "../shared/types";

export type ExcelCellSnapshot = {
  column: number;
  address: string;
  value: string;
  kind: "blank" | "boolean" | "date" | "formula" | "number" | "text";
  numberFormat?: string;
};

export type ExcelWorksheetSummary = {
  name: string;
  rowCount: number;
  columnCount: number;
  headerRow: number | null;
  headers: ExcelCellSnapshot[];
  columnFormats: {
    header: string;
    kindSamples: string[];
    numberFormats: string[];
    valueSamples: string[];
  }[];
  rows: {
    rowNumber: number;
    values: Record<string, string>;
  }[];
};

export type ExcelPracticeCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type ExcelPracticeParseResult = {
  filename: string;
  worksheetCount: number;
  worksheets: ExcelWorksheetSummary[];
  requiredColumns: string[];
  missingRequiredColumns: string[];
  checks: ExcelPracticeCheck[];
  warnings: string[];
};

const MAX_SHEETS = 5;
const MAX_HEADER_SCAN_ROWS = 10;
const MAX_COLUMNS = 24;
const MAX_DATA_ROWS = 12;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeHeader(value: string): string {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function valueToText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return cleanText(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return cleanText(value.map(valueToText).filter(Boolean).join(" "));
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.richText)) {
      return cleanText(
        obj.richText
          .map((part) =>
            typeof part === "object" && part !== null && "text" in part
              ? String((part as { text?: unknown }).text ?? "")
              : "",
          )
          .join(""),
      );
    }
    if ("text" in obj) return cleanText(String(obj.text ?? ""));
    if ("result" in obj) return valueToText(obj.result);
    if ("formula" in obj) {
      const result = valueToText(obj.result);
      return result
        ? `Formula ${String(obj.formula)} menghasilkan ${result}`
        : `Formula ${String(obj.formula)}`;
    }
  }
  return cleanText(String(value));
}

function cellKind(cell: ExcelJS.Cell): ExcelCellSnapshot["kind"] {
  const value = cell.value;
  if (value == null || valueToText(value) === "") return "blank";
  if (value instanceof Date) return "date";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "object" && "formula" in value) return "formula";
  return "text";
}

function snapshotCell(cell: ExcelJS.Cell, column: number): ExcelCellSnapshot {
  const kind = cellKind(cell);
  return {
    column,
    address: cell.address,
    value: valueToText(cell.value),
    kind,
    numberFormat: cell.numFmt,
  };
}

function collectRowCells(
  row: ExcelJS.Row,
  maxColumns: number,
): ExcelCellSnapshot[] {
  const cells: ExcelCellSnapshot[] = [];
  for (let column = 1; column <= maxColumns; column++) {
    const cell = row.getCell(column);
    const snapshot = snapshotCell(cell, column);
    if (snapshot.value) cells.push(snapshot);
  }
  return cells;
}

function detectHeaderRow(
  worksheet: ExcelJS.Worksheet,
): { rowNumber: number | null; headers: ExcelCellSnapshot[] } {
  const scanRows = Math.min(worksheet.rowCount, MAX_HEADER_SCAN_ROWS);
  const maxColumns = Math.min(
    Math.max(worksheet.columnCount, worksheet.actualColumnCount, 1),
    MAX_COLUMNS,
  );

  for (let rowNumber = 1; rowNumber <= scanRows; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const cells = collectRowCells(row, maxColumns);
    const textCells = cells.filter((cell) => cell.value.length > 0);
    if (textCells.length >= 2) {
      return { rowNumber, headers: textCells };
    }
  }

  return { rowNumber: null, headers: [] };
}

function summarizeWorksheet(worksheet: ExcelJS.Worksheet): ExcelWorksheetSummary {
  const { rowNumber: headerRow, headers } = detectHeaderRow(worksheet);
  const rows: ExcelWorksheetSummary["rows"] = [];
  const columnFormats = new Map<
    number,
    {
      header: string;
      kindSamples: Set<string>;
      numberFormats: Set<string>;
      valueSamples: string[];
    }
  >();
  const maxColumns = Math.min(
    Math.max(worksheet.columnCount, worksheet.actualColumnCount, 1),
    MAX_COLUMNS,
  );

  if (headerRow) {
    for (const header of headers) {
      columnFormats.set(header.column, {
        header: header.value,
        kindSamples: new Set<string>(),
        numberFormats: new Set<string>(),
        valueSamples: [],
      });
    }

    const lastRow = Math.min(worksheet.rowCount, headerRow + MAX_DATA_ROWS);
    for (let rowNumber = headerRow + 1; rowNumber <= lastRow; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const cells = collectRowCells(row, maxColumns);
      if (cells.length === 0) continue;

      const values: Record<string, string> = {};
      for (const cell of cells) {
        const header = headers.find((h) => h.column === cell.column);
        const key = header?.value || `Kolom ${cell.column}`;
        values[key] = cell.value;

        const format = columnFormats.get(cell.column);
        if (format) {
          format.kindSamples.add(cell.kind);
          if (cell.numberFormat) format.numberFormats.add(cell.numberFormat);
          if (format.valueSamples.length < 3) format.valueSamples.push(cell.value);
        }
      }
      rows.push({ rowNumber, values });
    }
  }

  return {
    name: worksheet.name,
    rowCount: worksheet.rowCount,
    columnCount: worksheet.actualColumnCount || worksheet.columnCount,
    headerRow,
    headers,
    columnFormats: [...columnFormats.values()].map((format) => ({
      header: format.header,
      kindSamples: [...format.kindSamples],
      numberFormats: [...format.numberFormats],
      valueSamples: format.valueSamples,
    })),
    rows,
  };
}

function extractRequiredColumns(task: PracticeTask): string[] {
  const columns = new Set<string>();
  for (const instruction of task.instructions) {
    if (!/kolom/i.test(instruction)) continue;
    const matches = instruction.matchAll(/['"]([^'"]+)['"]/g);
    for (const match of matches) {
      const value = cleanText(match[1] ?? "");
      if (!value || /\.xlsx$/i.test(value)) continue;
      columns.add(value);
    }
  }
  return [...columns];
}

function headerMatches(actual: string, expected: string): boolean {
  const a = normalizeHeader(actual);
  const e = normalizeHeader(expected);
  return a === e || a.includes(e) || e.includes(a);
}

function collectAllHeaders(worksheets: ExcelWorksheetSummary[]): string[] {
  return worksheets.flatMap((worksheet) =>
    worksheet.headers.map((header) => header.value),
  );
}

function buildChecks(
  filename: string,
  worksheets: ExcelWorksheetSummary[],
  requiredColumns: string[],
): { checks: ExcelPracticeCheck[]; missingRequiredColumns: string[] } {
  const headers = collectAllHeaders(worksheets);
  const missingRequiredColumns = requiredColumns.filter(
    (expected) => !headers.some((actual) => headerMatches(actual, expected)),
  );
  const checks: ExcelPracticeCheck[] = [
    {
      id: "xlsx-extension",
      label: "Format file .xlsx",
      passed: /\.xlsx$/i.test(filename),
      detail: filename,
    },
    {
      id: "worksheet-present",
      label: "Workbook punya lembar kerja",
      passed: worksheets.length > 0,
      detail:
        worksheets.length > 0
          ? `${worksheets.length} sheet terbaca`
          : "Tidak ada sheet terbaca",
    },
  ];

  if (requiredColumns.length > 0) {
    checks.push({
      id: "required-columns",
      label: "Kolom wajib ditemukan",
      passed: missingRequiredColumns.length === 0,
      detail:
        missingRequiredColumns.length === 0
          ? `Semua kolom wajib ada: ${requiredColumns.join(", ")}`
          : `Kolom belum ditemukan: ${missingRequiredColumns.join(", ")}`,
    });
  }

  return { checks, missingRequiredColumns };
}

export function looksLikeXlsx(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
}

export async function parseExcelPracticeWorkbook(input: {
  buffer: Buffer;
  filename: string;
  task: PracticeTask;
}): Promise<ExcelPracticeParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    input.buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );

  const worksheets = workbook.worksheets
    .slice(0, MAX_SHEETS)
    .map(summarizeWorksheet);
  const requiredColumns = extractRequiredColumns(input.task);
  const { checks, missingRequiredColumns } = buildChecks(
    input.filename,
    worksheets,
    requiredColumns,
  );
  const warnings: string[] = [];

  if (workbook.worksheets.length > MAX_SHEETS) {
    warnings.push(
      `Workbook punya ${workbook.worksheets.length} sheet, ringkasan dibatasi ${MAX_SHEETS} sheet pertama.`,
    );
  }
  if (worksheets.every((worksheet) => worksheet.headers.length === 0)) {
    warnings.push("Header tabel belum terbaca dari sheet mana pun.");
  }
  if (worksheets.every((worksheet) => worksheet.rows.length === 0)) {
    warnings.push("Data baris belum terbaca setelah header.");
  }

  return {
    filename: input.filename,
    worksheetCount: workbook.worksheets.length,
    worksheets,
    requiredColumns,
    missingRequiredColumns,
    checks,
    warnings,
  };
}

function formatRows(rows: ExcelWorksheetSummary["rows"]): string {
  if (rows.length === 0) return "Tidak ada baris data yang terbaca.";
  return rows
    .slice(0, 8)
    .map((row) => {
      const values = Object.entries(row.values)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
      return `Baris ${row.rowNumber}: ${values}`;
    })
    .join("\n");
}

export function buildExcelPracticeEvidenceText(
  parsed: ExcelPracticeParseResult,
): string {
  const sheetBlock = parsed.worksheets
    .map((worksheet, index) => {
      const headers = worksheet.headers.map((header) => header.value).join(", ");
      const formats = worksheet.columnFormats
        .map((column) =>
          [
            column.header,
            column.kindSamples.length > 0
              ? `tipe ${column.kindSamples.join("/")}`
              : "",
            column.numberFormats.length > 0
              ? `format ${column.numberFormats.join("/")}`
              : "",
            column.valueSamples.length > 0
              ? `contoh ${column.valueSamples.join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join(": "),
        )
        .filter(Boolean)
        .join("; ");
      return `Sheet ${index + 1}: ${worksheet.name}
Ukuran: ${worksheet.rowCount} baris, ${worksheet.columnCount} kolom
Header: ${headers || "Tidak terbaca"}
Format data: ${formats || "Tidak ada format khusus yang terbaca"}
${formatRows(worksheet.rows)}`;
    })
    .join("\n\n");

  const checks = parsed.checks
    .map(
      (check) =>
        `- ${check.label}: ${check.passed ? "lulus" : "perlu dicek"} (${check.detail})`,
    )
    .join("\n");
  const warnings =
    parsed.warnings.length > 0
      ? parsed.warnings.map((warning) => `- ${warning}`).join("\n")
      : "- Tidak ada peringatan parser.";

  return `BUKTI FILE EXCEL
Nama file: ${parsed.filename}
Jumlah sheet: ${parsed.worksheetCount}
Kolom wajib dari instruksi: ${parsed.requiredColumns.join(", ") || "Tidak terdeteksi otomatis"}

CEK OTOMATIS
${checks}

RINGKASAN WORKBOOK
${sheetBlock || "Tidak ada sheet yang terbaca."}

PERINGATAN PARSER
${warnings}`;
}
