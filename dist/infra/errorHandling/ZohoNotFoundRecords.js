"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ZohoNotFoundRecords extends Error {
    constructor(message, data, statusCode = 404, code = "ZOHO_NOT_FOUND_RECORDS") {
        super(message);
        this.data = data;
        this.statusCode = statusCode;
        this.code = code;
        this.name = "ZohoNotFoundRecords";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = ZohoNotFoundRecords;
