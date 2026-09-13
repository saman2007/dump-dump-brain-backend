import "dotenv/config";
import express from "express";
import * as bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json())

const serverPort = process.env.SERVER_PORT ? +process.env.SERVER_PORT : 3000;

app.listen(serverPort, (err) => {
  if (err) {
    console.log("Something went wrong when starting server:", err);

    return process.exit(1);
  }

  console.log(`The server is listening on port ${serverPort}.`);
});
