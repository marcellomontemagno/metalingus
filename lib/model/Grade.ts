import { z } from "zod";

export const gradeSchema = z.enum(["S235JR", "DX51"]);

type Grade = z.infer<typeof gradeSchema>;
export { type Grade as default };
