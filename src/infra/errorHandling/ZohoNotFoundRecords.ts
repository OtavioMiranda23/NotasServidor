export default class ZohoNotFoundRecords extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly data?: any;

  constructor(
    message: string,
    data: any,
    statusCode: number = 404,
    code: string = "ZOHO_NOT_FOUND_RECORDS"
  ) {
    super(message);
    this.data = data;
    this.statusCode = statusCode;
    this.code = code;
    this.name = "ZohoNotFoundRecords";
    Error.captureStackTrace(this, this.constructor);
  }
}
