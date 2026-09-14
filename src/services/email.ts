import path from "path";

import pug from "pug";
import "dotenv/config";
const EMAILJS_BASE_URL = "https://api.emailjs.com/api/v1.0";

const __dirname = import.meta.dirname;
const TEMPLATES_DIR = path.resolve(__dirname, "../templates/emails");

export interface SendEmailData {
  to: string;
  subject: string;
  fromName: string;
  html: string;
}

export async function sendEmail(data: SendEmailData): Promise<Response> {
  const url = `${EMAILJS_BASE_URL}/email/send`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: "main-template",
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: data,
    }),
  });

  return res;
}

/**
 * Sends a OTP verification email using Pug template
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  userName?: string,
): Promise<Response> {
  const templatePath = path.join(TEMPLATES_DIR, "otp.pug");
  const html = pug.renderFile(templatePath, {
    title: "Verify your Dump Dump Brain account",
    preheader: `Your verification code is ${otp}. Valid for 5 minutes.`,
    otp,
    userName,
  });

  return sendEmail({
    to,
    subject: `${otp} is your verification code`,
    fromName: "Dump Dump Brain",
    html,
  });
}

/**
 * Sends a welcome email to newly registered users using Pug template
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string,
): Promise<Response> {
  const templatePath = path.join(TEMPLATES_DIR, "welcome.pug");
  const html = pug.renderFile(templatePath, {
    title: "Welcome to Dump Dump Brain!",
    preheader: `Welcome to Dump Dump Brain, ${userName}!`,
    userName,
  });

  return sendEmail({
    to,
    subject: "Welcome to Dump Dump Brain! 🎉",
    fromName: "Dump Dump Brain",
    html,
  });
}
