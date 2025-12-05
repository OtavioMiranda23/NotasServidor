"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const QiveApi_1 = __importDefault(require("../../infra/http/qive/QiveApi"));
const createImage_1 = __importDefault(require("./createImage"));
class GetNFe {
    constructor(zoho, credentials, successConfig) {
        this.zoho = zoho;
        this.credentials = credentials;
        this.successConfig = successConfig;
    }
    async execute(dataNFe, errorConfig) {
        const createImage = new createImage_1.default();
        const qive = new QiveApi_1.default(this.zoho, createImage, this.credentials, this.successConfig);
        const result = await qive.getReceivesNFe(dataNFe, errorConfig);
        return result;
    }
}
exports.default = GetNFe;
