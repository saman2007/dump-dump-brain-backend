import * as p from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: p.timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: p.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  deletedAt: p.timestamp({ withTimezone: true }),
};
