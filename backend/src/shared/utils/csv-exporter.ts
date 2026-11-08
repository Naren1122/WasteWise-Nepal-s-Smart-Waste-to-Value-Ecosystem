import type { Response } from 'express';

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Sanitizes a cell value for standard RFC 4180 CSV output.
 * Prevents delimiter collision and CSV formula injection.
 */
export const sanitizeCsvCell = (val: string | number | boolean | null | undefined): string => {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // Guard against CSV formula injection in spreadsheet software (=, +, -, @)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Escape existing quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * Streams a dataset to an Express Response as a downloadable CSV.
 * Supports zero-duplication for any tabular entity across modules.
 */
export const streamCsvResponse = <T>(
  res: Response,
  filename: string,
  columns: CsvColumn<T>[],
  data: Iterable<T> | T[]
): void => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Write UTF-8 BOM for Microsoft Excel compatibility
  res.write('\uFEFF');

  // Write CSV Header
  const headerLine = columns.map((c) => sanitizeCsvCell(c.header)).join(',') + '\r\n';
  res.write(headerLine);

  // Write Data Rows
  for (const row of data) {
    const rowLine = columns.map((c) => sanitizeCsvCell(c.accessor(row))).join(',') + '\r\n';
    res.write(rowLine);
  }

  res.end();
};

