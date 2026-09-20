import type { AnyDataRow, ColumnConfig, ShopifyCSVContainer } from "@/types/crawl";

/**
 * Group row indices by their Handle value, preserving first-seen order.
 */
function groupByHandle(handleColumn: string[]): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  handleColumn.forEach((handle, index) => {
    const bucket = groups.get(handle);
    if (bucket) {
      bucket.push(index);
    } else {
      groups.set(handle, [index]);
    }
  });
  return groups;
}

/**
 * Merge the original CSV (`origin`) with freshly fetched rows (`output`) using
 * a per-field override configuration.
 *
 * Rows are matched by Handle, then paired in order within each handle's row
 * block (master/variant rows are emitted in the same order on both sides).
 * - A field is only taken from `output` when its config says `allowOverride`
 *   AND the fetched value is non-empty; otherwise the `origin` value wins.
 * - Extra `output` rows beyond `origin`'s count for a handle (e.g. a new
 *   variant appeared on the live store) are appended as-is, since there is no
 *   origin row to preserve values from.
 * - Extra `origin` rows beyond `output`'s count for a handle (e.g. the handle
 *   was not fetched, or fewer rows came back) are kept as-is.
 */
export function mergeOriginWithOutput(
  origin: ShopifyCSVContainer,
  output: ShopifyCSVContainer,
  columnConfig: ColumnConfig[]
): { headers: string[]; data: string[][] } {
  const headers = origin.headers;
  const allowOverrideByHeader = new Map(columnConfig.map((field) => [field.name, field.allowOverride]));

  const originHandleIndex = headers.indexOf("Handle");

  const originRows: string[][] = origin.data.map((row: AnyDataRow) =>
    headers.map((header) => String(row[header] ?? ""))
  );
  const outputRows: string[][] = output.data.map((row: AnyDataRow) =>
    headers.map((header) => String(row[header] ?? ""))
  );

  const originGroups = groupByHandle(originRows.map((row) => row[originHandleIndex] ?? ""));
  const outputGroups = groupByHandle(outputRows.map((row) => row[originHandleIndex] ?? ""));

  const mergedRows: string[][] = [];

  for (const [handle, originIndices] of originGroups) {
    const outputIndices = outputGroups.get(handle) ?? [];

    originIndices.forEach((originRowIndex, position) => {
      const originRow = originRows[originRowIndex];
      const outputRowIndex = outputIndices[position];

      if (outputRowIndex === undefined) {
        mergedRows.push(originRow);
        return;
      }

      const outputRow = outputRows[outputRowIndex];
      const mergedRow = headers.map((header, columnIndex) => {
        const allowOverride = allowOverrideByHeader.get(header) ?? false;
        const outputValue = outputRow[columnIndex] ?? "";
        return allowOverride && outputValue !== "" ? outputValue : originRow[columnIndex];
      });
      mergedRows.push(mergedRow);
    });

    if (outputIndices.length > originIndices.length) {
      for (let i = originIndices.length; i < outputIndices.length; i++) {
        mergedRows.push(outputRows[outputIndices[i]]);
      }
    }
  }

  return { headers, data: mergedRows };
}
