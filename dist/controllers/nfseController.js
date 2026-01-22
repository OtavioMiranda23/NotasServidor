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
        const linksNames = {
            appName: "base-notas-qive",
            reportName: "Cursor_NFSe_Canceladas_Report",
        };
        const lastZohoCursor = await this.getLastCursor.execute(linksNames);
        const { cancelledIds, nextCursorQive } = await this.getCancelledNFSe.execute(lastZohoCursor);
        const linkNamesToDisable = {
            appName: "base-notas-qive",
            reportName: "Copy_of_NFSe_Report",
        };
        const configNotasCanceladas = {
            appName: "base-notas-qive",
            formName: "Historico_Notas_Canceladas",
        };
        const disabledNfses = await this.disableNfses.execute(cancelledIds, linkNamesToDisable, configNotasCanceladas);
        if (!disabledNfses.successItemsUpdate.length) {
            return "Nenhuma NFSe foi desabilitada.";
        }
        const linkNamesCursor = {
            appName: "base-notas-qive",
            formName: "Cursor_NFSe_Canceladas",
        };
        const updatedCursor = await this.updateLastCursor.execute(lastZohoCursor, nextCursorQive, linkNamesCursor);
        console.log("Success!");
        console.log(updatedCursor);
    }
}
exports.default = NFSeController;
