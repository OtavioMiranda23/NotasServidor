export default class ZohoGenericError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly data?: any;

  constructor(
    message: string,
    data: any,
    statusCode: number = 500,
    code: string = "ZOHO_GENERIC_ERROR"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    this.name = "ZohoGenericError";
    Error.captureStackTrace(this, this.constructor);
  }
}
