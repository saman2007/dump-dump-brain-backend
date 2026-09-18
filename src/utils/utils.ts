import crypto from "crypto";

import { getColumns, type Table } from "drizzle-orm";

/**
 * Returns all table columns except the ones specified in excludeList.
 */
export const getColumnsExcept = <
  T extends Table,
  const K extends keyof T["_"]["columns"] = never,
>(
  table: T,
  excludeList: K[] = [],
): Omit<T["_"]["columns"], K> => {
  const columns = { ...getColumns(table) } as Record<string, unknown>;

  for (const key of excludeList) {
    delete columns[key as string];
  }

  return columns as Omit<T["_"]["columns"], K>;
};

/**
 * Returns only the specified columns from the table.
 */
export const getColumnsIncludes = <
  T extends Table,
  const K extends keyof T["_"]["columns"],
>(
  table: T,
  includeList: K[],
): Pick<T["_"]["columns"], K> => {
  const allColumns = getColumns(table);
  const selectedCols = {} as Record<string, unknown>;

  for (const key of includeList) {
    selectedCols[key as string] = allColumns[key];
  }

  return selectedCols as Pick<T["_"]["columns"], K>;
};

/**
 * A helper function that generates a number with `length` digits using `crypto` module.
 */
export const generateOTP = (length: number): Promise<string> => {
  const min = 10 ** (length - 1);
  const max = 10 ** length;

  return new Promise((resolve, reject) => {
    crypto.randomInt(min, max, (err, value) => {
      if (err) return reject(err);

      resolve(value.toString());
    });
  });
};

/**
 * A class for custom errors that services throws
 */
export class ServiceError<T = unknown> {
  data: T;
  code: number;

  constructor(data: T, code: number) {
    this.data = data;
    this.code = code;
  }
}

/**
 * A function to generate a random `n` bytes string
 */
export const generateRandomString = (n: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(n, (err, buf) => {
      if (err) return reject(err);

      return resolve(buf.toString("hex"));
    });
  });
};
