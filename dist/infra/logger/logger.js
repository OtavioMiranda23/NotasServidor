"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const console_1 = require("console");
const pino_1 = __importDefault(require("pino"));
class Logger {
    constructor(path) {
        try {
            this.logger = (0, pino_1.default)({ level: "info" }, pino_1.default.destination(path));
        }
        catch (error) {
            (0, console_1.log)("Erro ao criar logger:", error);
        }
    }
    info(message) {
        if (!this.logger)
            return;
        try {
            this.logger.info(message);
        }
        catch (error) {
            console.log("Erro ao registrar info:", error);
        }
    }
    error(message, err) {
        if (!this.logger)
            return;
        try {
            this.logger.error({ err }, message);
        }
        catch (error) {
            console.log("Erro ao registrar error:", error);
        }
    }
}
exports.default = Logger;
