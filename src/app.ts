import "dotenv/config";
import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors";

import authRouter from "./routes/auth.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import otpRouter from "./routes/otp.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(authRouter);
app.use(otpRouter);

app.use(notFoundHandler);

const serverPort = process.env.SERVER_PORT ? +process.env.SERVER_PORT : 3000;

app.listen(serverPort, (err) => {
  if (err) {
    console.log("Something went wrong when starting server:", err);

    return process.exit(1);
  }

  console.log(`The server is listening on port ${serverPort}.`);
});
