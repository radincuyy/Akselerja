import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  buildExcelPracticeEvidenceText,
  looksLikeXlsx,
  parseExcelPracticeWorkbook,
} from "@/lib/learning/practice-excel";
import {
  EXCEL_PRACTICE_MAX_BYTES,
  resolvePracticeSubmission,
} from "@/lib/learning/practice-submission";
import type { PracticeTask } from "@/lib/shared/types";

const excelTask: PracticeTask = {
  id: "excel-stock",
  slug: "excel-stock",
  role: "Warehouse Admin",
  title: "Pencatatan Stok Barang Masuk dengan Excel",
  skillId: "excel",
  type: "case-simulation",
  estimatedMinutes: 12,
  sourceLabel: "test",
  sourceNotes: [],
  scenario:
    "Ada kiriman 500 unit produk baru Kopi Bubuk Premium dari pemasok.",
  instructions: [
    "Buat lembar kerja baru di Microsoft Excel.",
    "Buat kolom-kolom berikut: 'Tanggal Penerimaan', 'Nama Produk', 'Kode Produk', 'Jumlah Unit', 'Nama Pemasok', dan 'Keterangan'.",
    "Isi data untuk penerimaan 'Kopi Bubuk Premium' sebanyak 500 unit dari pemasok 'PT Aroma Nusantara' pada tanggal hari ini.",
    "Simpan file Excel dengan nama 'Penerimaan_Stok_Kopi_Bubuk_Premium_[TanggalHariIni].xlsx'.",
  ],
  expectedEvidence: ["Workbook Excel berisi data stok masuk."],
  rubric: [
    {
      id: "structure",
      name: "Struktur workbook",
      description: "Kolom dan data sesuai instruksi.",
      weight: 100,
      signals: ["Tanggal Penerimaan", "Jumlah Unit"],
    },
  ],
};

async function buildWorkbookBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Penerimaan Stok");
  sheet.addRow([
    "Tanggal Penerimaan",
    "Nama Produk",
    "Kode Produk",
    "Jumlah Unit",
    "Nama Pemasok",
    "Keterangan",
  ]);
  sheet.addRow([
    new Date("2026-06-01T00:00:00.000Z"),
    "Kopi Bubuk Premium",
    "KBP-001",
    500,
    "PT Aroma Nusantara",
    "Barang diterima baik",
  ]);
  sheet.getColumn(1).numFmt = "dd/mm/yyyy";
  sheet.getColumn(4).numFmt = "#,##0";

  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
}

describe("resolvePracticeSubmission", () => {
  it("detects Excel file tasks from instructions", () => {
    expect(resolvePracticeSubmission(excelTask).mode).toBe("excel-file");
  });

  it("uses a 400 KB limit for spreadsheet submissions", () => {
    expect(EXCEL_PRACTICE_MAX_BYTES).toBe(400 * 1024);
    expect(resolvePracticeSubmission(excelTask)).toMatchObject({
      mode: "excel-file",
      maxFileSizeBytes: 400 * 1024,
    });
  });

  it("detects Google Sheets tasks as spreadsheet uploads", () => {
    expect(
      resolvePracticeSubmission({
        ...excelTask,
        title: "Pencatatan stok barang masuk dengan Google Sheets",
        instructions: [
          "Buat spreadsheet baru di Google Sheets.",
          "Buat kolom Tanggal Penerimaan, Nama Produk, dan Jumlah Unit.",
          "Isi data penerimaan barang lalu unduh sebagai file .xlsx.",
        ],
      }).mode,
    ).toBe("excel-file");
  });

  it("keeps ordinary practice as text-only", () => {
    expect(
      resolvePracticeSubmission({
        ...excelTask,
        title: "Analisis kasus layanan pelanggan",
        skillId: "komunikasi",
        instructions: ["Jelaskan langkah menangani keluhan pelanggan."],
        expectedEvidence: ["Ada langkah komunikasi."],
      }).mode,
    ).toBe("text");
  });
});

describe("parseExcelPracticeWorkbook", () => {
  it("summarizes workbook headers, rows, and required columns", async () => {
    const buffer = await buildWorkbookBuffer();
    expect(looksLikeXlsx(buffer)).toBe(true);

    const parsed = await parseExcelPracticeWorkbook({
      buffer,
      filename: "Penerimaan_Stok_Kopi_Bubuk_Premium_2026-06-01.xlsx",
      task: excelTask,
    });

    expect(parsed.missingRequiredColumns).toEqual([]);
    expect(parsed.worksheets[0]?.headers.map((h) => h.value)).toContain(
      "Jumlah Unit",
    );
    expect(parsed.worksheets[0]?.rows[0]?.values["Nama Produk"]).toBe(
      "Kopi Bubuk Premium",
    );
    expect(
      parsed.worksheets[0]?.columnFormats.find(
        (column) => column.header === "Jumlah Unit",
      )?.numberFormats,
    ).toContain("#,##0");

    const evidenceText = buildExcelPracticeEvidenceText(parsed);
    expect(evidenceText).toContain("Kopi Bubuk Premium");
    expect(evidenceText).toContain("Kolom wajib ditemukan: lulus");
  });
});
