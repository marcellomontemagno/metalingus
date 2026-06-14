import type { ZodType } from "zod";
import parseRow from "./parseRow";

export default function parseRows<T>(
  schema: ZodType<T>,
  rows: Record<string, unknown>[],
): T[] {
  return rows.map((r) => parseRow(schema, r));
}
