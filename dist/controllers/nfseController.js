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
    constructor(getNFSe, dateToSearch, getCancelledNFSe, disableNfses, getLastCursor, updateLastCursor) {
        this.getNFSe = getNFSe;
        this.dateToSearch = dateToSearch?.trim() || undefined;
        this.getCancelledNFSe = getCancelledNFSe;
        this.disableNfses = disableNfses;
        this.getLastCursor = getLastCursor;
        this.updateLastCursor = updateLastCursor;
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
    async updateCancelledNFSe() {
        const formReportNames = {
            formName: "Cursor_NFSe_Canceladas",
            tableName: "Cursor_NFSe_Canceladas_Report",
        };
        const lastZohoCursor = await this.getLastCursor.execute(formReportNames.tableName);
        const { cancelledIds, nextCursorQive } = await this.getCancelledNFSe.execute(lastZohoCursor);
        const disabledNfses = await this.disableNfses.execute(cancelledIds);
        await this.updateLastCursor.execute(lastZohoCursor, nextCursorQive, formReportNames);
    }
}
exports.default = NFSeController;
