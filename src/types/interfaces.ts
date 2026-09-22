export interface APISuccess<T = null> {
  success: true;
  message: string | null;
  data: T;
}

export interface APIError {
  success: false;
  message: string;
  data: unknown;
  errorCode?: number;
}
