import type User from "./User";

export default function createUser(overrides: Partial<User> = {}): User {
  return {
    id: "",
    name: null,
    email: null,
    emailVerified: null,
    image: null,
    ...overrides,
  };
}
