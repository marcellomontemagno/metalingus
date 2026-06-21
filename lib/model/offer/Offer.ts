import { z } from "zod";
import { gradeSchema } from "../Grade";
import { shapeSchema } from "../Shape";
import { currencySchema } from "../Currency";

export const offerSchema = z.object({
  id: z.uuid(),
  barsAvailable: z.coerce.number().int().positive(),
  grade: gradeSchema,
  shape: shapeSchema,
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  thickness: z.coerce.number().positive(),
  barsPerBundle: z.coerce.number().int().positive(),
  weightPerMeter: z.coerce.number().positive(),
  pricePerMeter: z.coerce.number().positive(),
  currency: currencySchema,
  notes: z.string().nullable(),
  userId: z.uuid(),
});

type Offer = z.infer<typeof offerSchema>;
export { type Offer as default };
