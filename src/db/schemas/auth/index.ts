import * as p from "drizzle-orm/pg-core";

const authSchema = p.snakeCase.schema("auth");

export default authSchema;
