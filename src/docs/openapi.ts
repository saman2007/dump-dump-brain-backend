import z from "zod";
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

import fs from "fs";
import path from "path";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const getAPIDocFile = (filename: string) => {
  return fs.readFileSync(
    path.join(import.meta.dirname, "markdown", filename + ".md"),
    { encoding: "utf-8" },
  );
};

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Dump Dump Brain API Docs",
      version: "1.0.0",
      description: `You can find the documentation of all API endpoints here.`,
    },
    tags: [
      {
        name: "Auth",
        description: "The documentation of auth APIs are below.",
      },
      { name: "OTP", description: "The documentation of OTP APIs are below." },
    ],
    servers: [
      {
        url: "http://localhost:" + (process.env.API_SERVER_PORT || "3000"),
        description: "Local server",
      },
    ],
  });
}
