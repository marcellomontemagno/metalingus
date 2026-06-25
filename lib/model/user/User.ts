import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  // Better Auth stores emailVerified as a boolean.
  emailVerified: z.coerce.boolean().nullable(),
  image: z.string().nullable(),
  // Phase 3: platform role — `operator` (broker/platform, sees-all) or null.
  platformRole: z.string().nullable().optional(),
});

type User = z.infer<typeof userSchema>;
export { type User as default };
