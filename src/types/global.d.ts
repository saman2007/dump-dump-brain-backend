type StringBoolean = "true" | "false";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      DATABASE_SUPPORT_SSL: StringBoolean;
      API_SERVER_PORT?: string;
      DOC_SERVER_PORT?: string;
      EMAILJS_SERVICE_ID: string;
      EMAILJS_PUBLIC_KEY: string;
      EMAILJS_PRIVATE_KEY: string;
      JWT_PRIVATE_KEY: string;
      BEHIND_PROXY: StringBoolean;
      WEBSITE_SECURE: StringBoolean;
    }
  }
}

export {};
