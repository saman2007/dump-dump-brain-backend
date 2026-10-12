import * as p from "drizzle-orm/pg-core";

const profileSchema = p.snakeCase.schema("profile");

export default profileSchema;
