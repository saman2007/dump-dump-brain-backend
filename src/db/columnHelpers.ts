import * as p from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: p
    .timestamp({ withTimezone: true, precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: p
    .timestamp({ withTimezone: true, precision: 3 })
    .$onUpdate(() => new Date()),
  deletedAt: p.timestamp({ withTimezone: true, precision: 3 }),
};
