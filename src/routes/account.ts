import express from "express";

import {
  validateActionKey,
  validateRequestData,
} from "../middlewares/validation.js";
import {
  verifyAccountPostController,
  verifyAccountSchema,
} from "../controllers/account.js";

const accountRouter = express.Router();

accountRouter.post(
  "/account/verify",
  validateRequestData(verifyAccountSchema, "body"),
  validateActionKey("account_verification"),
  verifyAccountPostController,
);

export default accountRouter;
