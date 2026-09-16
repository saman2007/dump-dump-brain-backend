import express from "express";
import { apiReference } from "@scalar/express-api-reference";

import { generateOpenAPIDocument } from "./openapi.js";

const app = express();

app.use(express.json(), express.urlencoded({ extended: true }));

const apiDocJsonContent = generateOpenAPIDocument();

app.get(
  "/docs",
  apiReference({
    content: apiDocJsonContent,
    title: "Dump Dump Brain API Docs",
    pageTitle: "Dump Dump Brain API Docs",
    theme: "purple",
  }),
);

const serverPort = process.env.DOC_SERVER_PORT
  ? +process.env.DOC_SERVER_PORT
  : 3001;

app.listen(serverPort, (err) => {
  if (err) {
    console.log("Something went wrong when starting doc server:", err);

    return process.exit(1);
  }

  console.log(`The doc server is listening on port ${serverPort}.`);
});
