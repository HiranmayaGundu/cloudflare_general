export { };
import { Temporal } from '@js-temporal/polyfill';

declare global {
  const posts_kv: KVNamespace;
}

declare global {
  interface Date {
    toTemporalInstant(this: Date): Temporal.Instant;
  }
}
