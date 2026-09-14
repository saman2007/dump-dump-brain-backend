declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      DATABASE_SUPPORT_SSL: string;
      SERVER_PORT?: string;
      EMAILJS_SERVICE_ID: string;
      EMAILJS_PUBLIC_KEY: string;
      EMAILJS_PRIVATE_KEY: string;
    }
  }
}

export {};
