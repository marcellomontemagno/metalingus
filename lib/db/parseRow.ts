import { camelCase, mapKeys } from "lodash";
import type { ZodType } from "zod";

// neon rows are flat objects, so a shallow key rename is enough.
const camelizeRow = (row: Record<string, unknown>) =>
  mapKeys(row, (_v, k) => camelCase(k));

export default function parseRow<T>(
  schema: ZodType<T>,
  row: Record<string, unknown>,
): T {
  return schema.parse(camelizeRow(row));
}
