import { z } from "zod";
import { gradeSchema } from "../Grade";
import { shapeSchema } from "../Shape";
import dateOnlySchema from "../../utils/dateOnlySchema";

export const inquirySchema = z.object({
  id: z.uuid(),
  barsRequested: z.coerce.number().int().positive(),
  latestDeliveryDate: dateOnlySchema.nullable(),
  grade: gradeSchema,
  shape: shapeSchema,
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  thickness: z.coerce.number().positive(),
  notes: z.string().nullable(),
  userId: z.uuid().nullable(),
});

type Inquiry = z.infer<typeof inquirySchema>;
export { type Inquiry as default };
