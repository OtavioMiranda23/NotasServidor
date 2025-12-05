"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataNFeSchema = void 0;
const zod_1 = require("zod");
exports.DataNFeSchema = zod_1.z.object({
    dateFrom: zod_1.z.string(),
    dateTo: zod_1.z.string(),
    cursor: zod_1.z.string().optional(),
    isV2: zod_1.z.boolean(),
});
class NFeController {
    constructor(getNFe) {
        this.getNFe = getNFe;
    }
    async createNFe(errorConfig) {
        try {
            const [currentDate, _] = new Date().toISOString().split("T")[0];
            const dataNFe = {
                dateFrom: currentDate,
                dateTo: currentDate,
                cursor: "",
                isV2: false,
            };
            const dataNFeRaw = dataNFe;
            const dataResult = await this.getNFe.execute(dataNFeRaw, errorConfig);
            const result = {
                data: dataResult,
                message: "NFe processada com sucesso",
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
exports.default = NFeController;
