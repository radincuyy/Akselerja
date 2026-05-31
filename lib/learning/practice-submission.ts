import type { PracticeSubmission, PracticeTask } from "../shared/types";

export const EXCEL_PRACTICE_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const EXCEL_PRACTICE_MAX_BYTES = 400 * 1024;

const SPREADSHEET_TERMS = [
  "excel",
  ".xlsx",
  "google sheet",
  "google sheets",
  "google spreadsheet",
  "spreadsheet",
  "lembar kerja",
  "worksheet",
  "workbook",
  "format tanggal",
  "format angka",
  "simpan file",
];

const SPREADSHEET_ACTION_TERMS = [
  "buat",
  "buat lembar kerja",
  "buat kolom",
  "isi data",
  "catat",
  "pencatatan",
  "susun",
  "olah data",
  "simpan file",
  "download",
  "unduh",
  "export",
  "ekspor",
  "unggah",
  "upload",
  "lampirkan",
];

function taskText(task: PracticeTask): string {
  return [
    task.title,
    task.scenario,
    ...task.instructions,
    ...task.expectedEvidence,
  ]
    .join(" ")
    .toLowerCase();
}

export function resolvePracticeSubmission(
  task: PracticeTask,
): PracticeSubmission {
  if (task.submission) return task.submission;

  const text = taskText(task);
  const mentionsSpreadsheet = SPREADSHEET_TERMS.some((term) =>
    text.includes(term),
  );
  const asksForSpreadsheetWork = SPREADSHEET_ACTION_TERMS.some((term) =>
    text.includes(term),
  );

  if (mentionsSpreadsheet && asksForSpreadsheetWork) {
    return {
      mode: "excel-file",
      acceptedFileTypes: ["xlsx"],
      maxFileSizeBytes: EXCEL_PRACTICE_MAX_BYTES,
      summaryRequired: true,
    };
  }

  return { mode: "text" };
}

export function isExcelPracticeSubmission(
  submission: PracticeSubmission,
): submission is Extract<PracticeSubmission, { mode: "excel-file" }> {
  return submission.mode === "excel-file";
}

export function formatPracticeFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
