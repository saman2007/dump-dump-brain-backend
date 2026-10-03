import * as p from "drizzle-orm/pg-core";

const dumpsSchema = p.snakeCase.schema("dumps");

export default dumpsSchema;
