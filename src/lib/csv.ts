// Generación de CSV simple y segura (escapa comillas, comas y saltos de línea).

export type CsvColumn<T> = { key: keyof T & string; label: string };

function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.label)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCell(row[column.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

// Respuesta HTTP de descarga CSV (con BOM para que Excel respete UTF-8).
export function csvResponse(csv: string, filename: string): Response {
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
