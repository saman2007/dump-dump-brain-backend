import type { InferEnum } from "drizzle-orm";

import type { otpTypeEnum } from "../../db/schemas/otps.js";

export type OTPType = InferEnum<typeof otpTypeEnum>;
