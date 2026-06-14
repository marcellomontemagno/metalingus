import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  // email_verified is a timestamptz; neon may hand it back as a string or Date.
  emailVerified: z.coerce.date().nullable(),
  image: z.string().nullable(),
});

type User = z.infer<typeof userSchema>;
export { type User as default };
