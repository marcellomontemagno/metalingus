import { z } from "zod";

export const currencySchema = z.enum(["EUR", "USD", "GBP"]);

type Currency = z.infer<typeof currencySchema>;
export { type Currency as default };
