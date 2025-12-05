"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QiveApiError extends Error {
    constructor(message, data, statusCode = 500, code = "QIVE_API_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.data = data;
        this.name = "QiveError";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = QiveApiError;
