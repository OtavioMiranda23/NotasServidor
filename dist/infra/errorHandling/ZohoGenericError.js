"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ZohoGenericError extends Error {
    constructor(message, data, statusCode = 500, code = "ZOHO_GENERIC_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.data = data;
        this.name = "ZohoGenericError";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = ZohoGenericError;
