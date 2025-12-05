"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ZohoApi_axios, _ZohoApi_accessToken, _ZohoApi_credentials;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const sleep_1 = __importDefault(require("../../utils/sleep"));
const InsertZohoError_1 = __importDefault(require("../../errorHandling/InsertZohoError"));
const ZohoGenericError_1 = __importDefault(require("../../errorHandling/ZohoGenericError"));
const ZohoNotFoundRecords_1 = __importDefault(require("../../errorHandling/ZohoNotFoundRecords"));
const form_data_1 = __importDefault(require("form-data"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const buffer_1 = require("buffer");
const node_stream_1 = require("node:stream");
const ZohoErrorSchema = zod_1.z.object({
    data: zod_1.z.object({
        result: zod_1.z.array(zod_1.z.object({
            code: zod_1.z.number(),
            error: zod_1.z.string(),
        })),
    }),
});
const AxiosErrorSchema = zod_1.z.object({
    response: zod_1.z.object({
        status: zod_1.z.number(),
        data: zod_1.z.any().optional(),
    }),
});
class ZohoApi {
    constructor(credentials) {
        _ZohoApi_axios.set(this, axios_1.default);
        _ZohoApi_accessToken.set(this, null);
        _ZohoApi_credentials.set(this, void 0);
        __classPrivateFieldSet(this, _ZohoApi_credentials, credentials, "f");
    }
    static async init(credentials) {
        const attempt = 1;
        const instance = new ZohoApi(credentials);
        await instance.updateTokenWithRetry(attempt, 3);
        return instance;
    }
    async updateToken() {
        if (!__classPrivateFieldGet(this, _ZohoApi_credentials, "f").refreshToken ||
            !__classPrivateFieldGet(this, _ZohoApi_credentials, "f").clientId ||
            !__classPrivateFieldGet(this, _ZohoApi_credentials, "f").clientSecret) {
            throw new ZohoGenericError_1.default("Missing Zoho credentials", "Erro ao atualizar token", 500);
        }
        const authUrl = `${__classPrivateFieldGet(this, _ZohoApi_credentials, "f").authBaseUrl}?client_id=${__classPrivateFieldGet(this, _ZohoApi_credentials, "f").clientId}&client_secret=${__classPrivateFieldGet(this, _ZohoApi_credentials, "f").clientSecret}&refresh_token=${__classPrivateFieldGet(this, _ZohoApi_credentials, "f").refreshToken}&grant_type=${__classPrivateFieldGet(this, _ZohoApi_credentials, "f").grantType}`;
        try {
            const response = await __classPrivateFieldGet(this, _ZohoApi_axios, "f").post(authUrl);
            __classPrivateFieldSet(this, _ZohoApi_accessToken, response.data.access_token, "f");
        }
        catch (error) {
            console.error(`ERROR TOKEN: ${error}`);
            __classPrivateFieldSet(this, _ZohoApi_accessToken, null, "f");
        }
    }
    async updateTokenWithRetry(attempt, attemptNumber) {
        while (__classPrivateFieldGet(this, _ZohoApi_accessToken, "f") == null && attempt < attemptNumber) {
            await (0, sleep_1.default)(1000);
            await this.updateToken();
            attempt++;
        }
    }
    static isInvalidResponse(res) {
        const errorsResponses = res.data.result.filter((result) => result.code !== 3000);
        if (!errorsResponses.length) {
            console.error("Registros não foram inseridos com sucesso:");
            console.error(errorsResponses);
            return false;
        }
        return true;
    }
    async deleteAllRecordsNFeTest(query) {
        const requestOptions = {
            headers: {
                Authorization: `Zoho-oauthtoken ${__classPrivateFieldGet(this, _ZohoApi_accessToken, "f")}`,
                "Content-Type": "application/json",
            },
            data: {
                criteria: `${query}`,
            },
        };
        const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/Copy_of_NFe_Report`;
        try {
            const result = await __classPrivateFieldGet(this, _ZohoApi_axios, "f").delete(url, requestOptions);
            return result;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) &&
                (error.status === 404 || error.response?.status === 404)) {
                console.error(error.response?.data);
                throw new ZohoNotFoundRecords_1.default(`Erro ao buscar registro: ${error.response?.data}`, error, 404);
            }
            else {
                throw error;
            }
        }
    }
    async deleteAllRecordsNFSeTest(query) {
        const requestOptions = {
            headers: {
                Authorization: `Zoho-oauthtoken ${__classPrivateFieldGet(this, _ZohoApi_accessToken, "f")}`,
                "Content-Type": "application/json",
            },
            data: {
                criteria: `${query}`,
            },
        };
        const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/Copy_of_NFSe_Report`;
        try {
            const result = await __classPrivateFieldGet(this, _ZohoApi_axios, "f").delete(url, requestOptions);
            return result;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) &&
                (error.status === 404 || error.response?.status === 404)) {
                console.error(error.response?.data);
                throw new ZohoNotFoundRecords_1.default(`Erro ao buscar registro: ${error.response?.data}`, error, 404);
            }
            else {
                throw error;
            }
        }
    }
    async getRecordByField(reportName, field) {
        const requestOptions = {
            headers: {
                Authorization: `Zoho-oauthtoken ${__classPrivateFieldGet(this, _ZohoApi_accessToken, "f")}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        };
        const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/base-notas-qive/report/${reportName}?${field.key}=${field.value}`;
        const result = await __classPrivateFieldGet(this, _ZohoApi_axios, "f").get(url, requestOptions);
        return result;
    }
    async insertRecord(content, config, attemptsNumber) {
        const attempt = 0;
        if (!__classPrivateFieldGet(this, _ZohoApi_accessToken, "f")) {
            await this.updateTokenWithRetry(attempt, attemptsNumber);
        }
        if (!__classPrivateFieldGet(this, _ZohoApi_accessToken, "f")) {
            throw new Error("accessToken is null");
        }
        const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/${config.tableName}/form/${config.formName}`;
        const requestOptions = {
            headers: {
                Authorization: `Zoho-oauthtoken ${__classPrivateFieldGet(this, _ZohoApi_accessToken, "f")}`,
                "Content-Type": "application/json",
            },
        };
        try {
            const res = await __classPrivateFieldGet(this, _ZohoApi_axios, "f").post(url, content, requestOptions);
            if (ZohoApi.isInvalidResponse(res)) {
                throw new InsertZohoError_1.default("Algum item não retornou 3000:", res.data, 500);
            }
            return res.data;
        }
        catch (e) {
            if (axios_1.default.isAxiosError(e)) {
                throw e;
            }
            const parsed = ZohoErrorSchema.safeParse(e);
            if (parsed.success) {
                parsed.data.data.result.forEach((err) => {
                    if (err.code !== 3000) {
                        throw new InsertZohoError_1.default("Erro ao salvar no Zoho", err, 400);
                    }
                });
            }
            else {
                console.error("Zod validation erro:");
                console.error(parsed.error);
                throw new Error(`Zod error, verifique o nome da tabela: ${JSON.stringify(parsed.error)}`);
            }
            const axiosParsed = AxiosErrorSchema.safeParse(e);
            if (axiosParsed.success) {
                const error = axiosParsed.data;
                if (error?.response.status === 401) {
                    await this.updateTokenWithRetry(attempt, attemptsNumber);
                    if (__classPrivateFieldGet(this, _ZohoApi_accessToken, "f") === null)
                        throw new Error("Erro 401");
                }
            }
            throw e;
        }
    }
    async uploadFile(data) {
        if (!__classPrivateFieldGet(this, _ZohoApi_accessToken, "f")) {
            throw new Error("accessToken is null ao fazer upload de arquivo");
        }
        const url = `https://www.zohoapis.com/creator/v2.1/data/guillaumon/${data.app_name}/report/${data.report_name}/${data.idCreatedRecord}/${data.field_name}/upload`;
        try {
            let formData = new form_data_1.default();
            formData.append("file", node_stream_1.Readable.from([data.buffer]), {
                filename: `${data.idCreatedRecord}.pdf`,
                contentType: "application/pdf",
            });
            let config = {
                method: "post",
                maxBodyLength: Infinity,
                url: url,
                headers: {
                    Authorization: `Zoho-oauthtoken ${__classPrivateFieldGet(this, _ZohoApi_accessToken, "f")}`,
                    ...formData.getHeaders(),
                },
                data: formData,
            };
            const response = await axios_1.default.request(config);
            console.log("------------------------");
            console.log(JSON.stringify(response.data));
            if (response.data?.code && response.data.code !== 3000) {
                throw new Error(`Erro Zoho: ${JSON.stringify(response.data)}`);
            }
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error("Axios error:", error.message);
                console.error("Status:", error.response?.status);
                console.error("Data:", error.response?.data);
            }
            else {
                console.error("Erro genérico no upload:", error);
            }
            throw error;
        }
    }
    async resolveUploadBuffer(data) {
        if (data.filePath || !data.blob) {
            const candidatePath = data.filePath
                ? data.filePath
                : node_path_1.default.resolve(process.cwd(), "mapa_we193.pdf");
            const absolutePath = node_path_1.default.isAbsolute(candidatePath)
                ? candidatePath
                : node_path_1.default.resolve(process.cwd(), candidatePath);
            const bufferFromFile = await promises_1.default.readFile(absolutePath);
            return {
                buffer: bufferFromFile,
                filename: node_path_1.default.basename(absolutePath),
            };
        }
        const source = Array.isArray(data.blob) ? data.blob[0] : data.blob;
        const buffer = await this.convertToBuffer(source);
        return { buffer, filename: "nota.pdf" };
    }
    async convertToBuffer(value) {
        if (Buffer.isBuffer(value)) {
            return value;
        }
        if (value instanceof Uint8Array) {
            return Buffer.from(value);
        }
        if (value instanceof buffer_1.Blob) {
            return Buffer.from(await value.arrayBuffer());
        }
        throw new Error("Tipo de arquivo para upload não suportado");
    }
}
_ZohoApi_axios = new WeakMap(), _ZohoApi_accessToken = new WeakMap(), _ZohoApi_credentials = new WeakMap();
exports.default = ZohoApi;
