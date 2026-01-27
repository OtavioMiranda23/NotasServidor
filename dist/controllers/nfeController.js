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
    constructor(getNFe, dateToSearch, getCancelledNFe, disableNfes, getLastCursor, updateLastCursor) {
        this.getNFe = getNFe;
        this.dateToSearch = dateToSearch?.trim() || undefined;
        this.getCancelledNFe = getCancelledNFe;
        this.disableNfes = disableNfes;
        this.getLastCursor = getLastCursor;
        this.updateLastCursor = updateLastCursor;
    }
    async createNFe(errorConfig) {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const [yesterdayDate, __] = yesterday.toISOString().split("T");
            const [currentDate, _] = new Date().toISOString().split("T");
            const dataNFe = {
                dateFrom: this.dateToSearch || yesterdayDate,
                dateTo: this.dateToSearch || currentDate,
                cursor: "",
                isV2: false,
            };
            console.log(`RODANDO COM O INPUT:`);
            console.log(dataNFe);
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
    async updateCancelledNFe() {
        try {
            const linksNames = {
                appName: "base-notas-qive",
                reportName: "Cursor_NFe_Canceladas_Report",
            };
            const lastZohoCursor = await this.getLastCursor.execute(linksNames);
            const { cancelledIds, nextCursorQive } = await this.getCancelledNFe.execute(lastZohoCursor);
            console.log("cancelledIds:", { cancelledIds, nextCursorQive });
        }
        catch (e) {
            console.error("Erro ao atualizar NFe canceladas:", e);
            return 500;
        }
    }
}
exports.default = NFeController;
