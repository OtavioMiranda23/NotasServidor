"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataNFSeSchema = void 0;
const zod_1 = require("zod");
exports.DataNFSeSchema = zod_1.z.object({
    dateFrom: zod_1.z.string(),
    dateTo: zod_1.z.string(),
    cursor: zod_1.z.string().optional(),
    isV2: zod_1.z.boolean(),
});
class NFSeController {
    constructor(getNFSe) {
        this.getNFSe = getNFSe;
    }
    async createNFSe(errorConfig) {
        try {
            const [currentDate, _] = new Date().toISOString().split("T")[0];
            const input = {
                dateFrom: currentDate,
                dateTo: currentDate,
                cursor: "",
                isV2: false,
            };
            const dataResult = await this.getNFSe.execute(input, errorConfig);
            const result = {
                data: dataResult,
                message: "NFSe processada com sucesso",
            };
            return {
                status: 200,
                data: result,
            };
        }
        catch (e) {
            return {
                status: e.statusCode || 500,
                error: {
                    message: e.message || "Erro interno do servidor",
                    code: e.code || undefined,
                    data: e.data || undefined,
                    timeStamp: new Date().toISOString(),
                },
            };
        }
    }
}
exports.default = NFSeController;
