import "dotenv/config";
import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import cookie from "cookie-parser";

import authRouter from "./routes/auth.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import otpRouter from "./routes/otp.js";
import accountRouter from "./routes/account.js";
import sessionsRouter from "./routes/sessions.js";
import userInfoRouter from "./routes/userInfo.js";

const app = express();

if (process.env.BEHIND_PROXY === "true") {
  app.set("trust proxy", true);
}

app.use(cors());
app.use(bodyParser.json());
app.use(cookie());

app.use(authRouter);
app.use(otpRouter);
app.use(accountRouter);
app.use(sessionsRouter);
app.use(userInfoRouter);

app.use(notFoundHandler);

const serverPort = process.env.API_SERVER_PORT
  ? +process.env.API_SERVER_PORT
  : 3000;

app.listen(serverPort, (err) => {
  if (err) {
    console.log("Something went wrong when starting server:", err);

    return process.exit(1);
  }

  console.log(`The server is listening on port ${serverPort}.`);
});
