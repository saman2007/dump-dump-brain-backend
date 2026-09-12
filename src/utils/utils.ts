import { getColumns, type Table } from "drizzle-orm";
/**
 * Returns all table columns except the ones specified in excludeList.
 */
export const getColumnsExcept = <
  T extends Table,
  K extends keyof T["_"]["columns"] = never,
>(
  table: T,
  excludeList: K[] = [],
): Omit<T["_"]["columns"], K> => {
  const columns = { ...getColumns(table) };

  for (const key of excludeList) {
    delete (columns as Record<string, unknown>)[key as string];
  }

  return columns as Omit<T["_"]["columns"], K>;
};

/**
 * Returns only the specified columns from the table.
 */
export const getColumnsIncludes = <
  T extends Table,
  K extends keyof T["_"]["columns"],
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
