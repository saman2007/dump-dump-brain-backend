import { Auth } from "../services/auth.js";
import type { Middleware } from "../types/types.js";
import { ServiceError } from "../utils/utils.js";

export const privateEndpoint: Middleware = (req, res, next) => {
  const accessToken = req.cookies.access_token;

  if (!accessToken)
    return res.status(401).json({
      success: false,
      data: null,
      message: "An access token is required.",
      errorCode: 4,
    });

  let accessTokenPayload;

  try {
    accessTokenPayload = Auth.verifyAccessToken(accessToken);
  } catch (e) {
    if (e instanceof ServiceError) {
      if (e.code === 0) {
        return res.status(401).json({
          success: false,
          data: null,
          message: "The token has expires, refresh it.",
          errorCode: 0,
        });
      } else {
        return res.status(401).json({
          success: false,
          data: null,
          message: e.data,
          errorCode: e.code,
        });
      }
    }

    next(e);
  }

  req.accessTokenPayload = accessTokenPayload;

  next();
};
