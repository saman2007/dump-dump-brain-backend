export interface APISuccess<T> {
  success: true;
  message: string | null;
  data: T;
}

export interface APIError<T> {
  success: false;
  message: string;
  data: T;
}
