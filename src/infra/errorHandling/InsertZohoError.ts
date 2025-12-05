export default class InsertZohoError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly data?: any;

  constructor(
    message: string,
    data: any,
    statusCode: number = 500,
    code: string = "INSERT_ZOHO_ERROR"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    this.name = "InsertZohoError";
    Error.captureStackTrace(this, this.constructor);
  }
}
