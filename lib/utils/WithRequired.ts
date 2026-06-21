// Makes every field of T optional except the keys K, which stay required with
// their original types. Used by the entity factories so callers must supply the
// non-defaultable fields (e.g. userId) while the factory fills in the rest.
type WithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export { type WithRequired as default };
