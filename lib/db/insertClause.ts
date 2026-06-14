import { snakeCase } from "lodash";

// builds the column list, "$1, $2, ..." placeholders, and ordered values for
// an INSERT, from an entity's camelCase fields — the inverse of parseRow's
// camelize-on-read.
export default function insertClause(fields: Record<string, unknown>): {
  columns: string;
  placeholders: string;
  values: unknown[];
} {
  const entries = Object.entries(fields);
  return {
    columns: entries.map(([k]) => snakeCase(k)).join(", "),
    placeholders: entries.map((_, i) => `$${i + 1}`).join(", "),
    values: entries.map(([, v]) => v),
  };
}
