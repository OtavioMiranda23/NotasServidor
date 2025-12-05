export default class QiveGenericError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly data?: any;

  constructor(
    message: string,
    data: any,
    statusCode: number = 500,
    code: string = "QIVE_GENERIC_ERROR"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    this.name = "QiveError";
    Error.captureStackTrace(this, this.constructor);
  }
}
