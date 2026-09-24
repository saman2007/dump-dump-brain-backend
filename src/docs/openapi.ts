import z from "zod";
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV32,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

import fs from "fs";
import path from "path";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const getApiMdFile = (filename: string) => {
  return fs.readFileSync(
    path.join(import.meta.dirname, "markdown", filename + ".md"),
    { encoding: "utf-8" },
  );
};

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV32(registry.definitions, {
    unionPreferredType: "oneOf",
  });

  return generator.generateDocument({
    openapi: "3.2.0",
    info: {
      title: "Dump Dump Brain API Docs",
      version: "1.0.0",
      description: getApiMdFile("info"),
    },
    tags: [
      {
        name: "Auth",
        description: getApiMdFile("auth"),
      },
      { name: "OTP", description: getApiMdFile("otp") },
      { name: "Account", description: getApiMdFile("account") },
      { name: "Sessions", description: getApiMdFile("sessions") },
    ],
    servers: [
      {
        url: "http://localhost:" + (process.env.API_SERVER_PORT || "3000"),
        description: "Local server",
      },
    ],
  });
}
