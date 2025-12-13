import { ParquetReader } from "parquets";

export async function readParquetRows(
  parquetPath: string,
  offset: number,
  limit: number,
): Promise<unknown[]> {
  const reader = await ParquetReader.openFile(parquetPath);
  try {
    const cursor = reader.getCursor();
    const rows: unknown[] = [];
    let row: unknown | null;
    let index = 0;

    // Skip until offset, then collect up to limit rows.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      row = await cursor.next();
      if (!row) break;
      if (index < offset) {
        index += 1;
        continue;
      }
      rows.push(row);
      index += 1;
      if (rows.length >= limit) break;
    }

    return rows;
  } finally {
    await reader.close();
  }
}

