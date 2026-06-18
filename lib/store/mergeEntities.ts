import { produce } from "immer";
import { setStore, type Store } from "./store";

type EntitiesPayload = Partial<{
  [K in keyof Store["entities"]]: { id: string }[];
}>;

// Generic normalized-payload merge: every API endpoint returns an envelope keyed by
// singular entity name (matching the store slices), so any response can be merged here.
// Upserts by id; never deletes (callers remove explicitly).
export default function mergeEntities(payload: EntitiesPayload) {
  setStore(
    produce((s: Store) => {
      for (const [type, rows] of Object.entries(payload)) {
        if (!rows) continue;
        const slice = s.entities[type as keyof Store["entities"]] as Record<
          string,
          unknown
        >;
        for (const row of rows) slice[row.id] = row;
      }
    }),
  );
}
