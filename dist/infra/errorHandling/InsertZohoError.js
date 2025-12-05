"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InsertZohoError extends Error {
    constructor(message, data, statusCode = 500, code = "INSERT_ZOHO_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.data = data;
        this.name = "InsertZohoError";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = InsertZohoError;
