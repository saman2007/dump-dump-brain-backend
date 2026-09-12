declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      DATABASE_SUPPORT_SSL: string;
      SERVER_PORT?: string;
    }
  }
}

export {};
