import z from "zod";
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const bearerAuth = registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
);

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
        description: "For authentication APIs",
      },
      { name: "OTP", description: "For OTP APIs" },
    ],
    servers: [
      {
        url: "http://localhost:" + (process.env.API_SERVER_PORT || "3000"),
        description: "Local server",
      },
    ],
  });
}
