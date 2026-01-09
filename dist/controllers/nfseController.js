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
    constructor(getNFSe, dateToSearch) {
        this.getNFSe = getNFSe;
        this.dateToSearch = dateToSearch?.trim() || undefined;
    }
    async createNFSe(errorConfig) {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const [yesterdayDate, __] = yesterday.toISOString().split("T");
            const [currentDate, _] = new Date().toISOString().split("T");
            const input = {
                dateFrom: this.dateToSearch || yesterdayDate,
                dateTo: this.dateToSearch || currentDate,
                cursor: "",
                isV2: false,
            };
            console.log(`RODANDO COM O INPUT:`);
            console.log(input);
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
    async cancelate(cursor) {
        if (!cursor) {
            console.error("Cursor inválido para buscar NFSe canceladas");
            throw new Error("Cursor inválido para buscar NFSe canceladas");
        }
        const cancelledNotas = await this.getCancelledNFSe.execute(cursor);
    }
}
exports.default = NFSeController;
