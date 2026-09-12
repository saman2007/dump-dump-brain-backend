import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schemas/*",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SUPPORT_SSL === "true",
  },
});
