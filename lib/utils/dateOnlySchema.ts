import { z } from "zod";

// A timezone-less calendar date, kept as a 'YYYY-MM-DD' string. Coercing a tz-less
// DATE to a JS Date parses it as UTC midnight and renders the prior day in negative-UTC
// timezones (off-by-one), so we keep it a string. neon may return either the bare date
// or a full timestamp/Date, so normalize to the first 10 chars.
const dateOnlySchema = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString() : v).slice(0, 10))
  .refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s), "Expected YYYY-MM-DD");

export default dateOnlySchema;
