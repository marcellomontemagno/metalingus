import { z } from "zod";

export const shapeSchema = z.enum(["SQUARE", "RECTANGULAR", "ROUND"]);

type Shape = z.infer<typeof shapeSchema>;
export { type Shape as default };
