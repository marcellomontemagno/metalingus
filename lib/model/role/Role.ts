import { z } from "zod";

export const roleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

type Role = z.infer<typeof roleSchema>;
export { type Role as default };
