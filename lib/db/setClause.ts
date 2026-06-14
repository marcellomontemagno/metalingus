import { snakeCase } from "lodash";

// builds the SET and WHERE clauses (with $1.. placeholders) plus the ordered
// values for an UPDATE, from an entity's camelCase fields — the inverse of
// parseRow's camelize-on-read. Columns named in `where` are filtered out of
// SET, so you don't hand-strip them from the fields.
export default function setClause({
  fields,
  where,
}: {
  fields: Record<string, unknown>;
  where: Record<string, unknown>;
}): { set: string; where: string; values: unknown[] } {
  const whereKeys = Object.keys(where);
  const cols = Object.entries(fields).filter(([k]) => !whereKeys.includes(k));
  return {
    set: cols.map(([k], i) => `${snakeCase(k)} = $${i + 1}`).join(", "),
    where: whereKeys
      .map((k, i) => `${snakeCase(k)} = $${cols.length + i + 1}`)
      .join(" AND "),
    values: [...cols.map(([, v]) => v), ...Object.values(where)],
  };
}
