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
    constructor(getNFe, dateToSearch, getCancelledNFe, disableNfes, getLastCursor, updateLastCursor, verifyCancelledNotas) {
        this.getNFe = getNFe;
        this.dateToSearch = dateToSearch?.trim() || undefined;
        this.getCancelledNFe = getCancelledNFe;
        this.disableNfes = disableNfes;
        this.getLastCursor = getLastCursor;
        this.updateLastCursor = updateLastCursor;
        this.verifyCancelledNotas = verifyCancelledNotas;
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
            if (cancelledIds.length === 0) {
                console.log("Nenhuma NFe foi desabilitada.");
                return 204;
            }
            console.log("cancelledIds:", { cancelledIds, nextCursorQive });
            const linkNamesToDisable = {
                appName: "base-notas-qive",
                reportName: "Copy_of_NFe_Report",
            };
            const configNotasCanceladas = {
                appName: "base-notas-qive",
                formName: "Historico_Notas_Canceladas",
            };
            const disabledNfes = await this.disableNfes.execute(cancelledIds, linkNamesToDisable, configNotasCanceladas);
            const configHistoricoNotasCanceladas = {
                appName: "base-notas-qive",
                reportName: "Historico_Notas_Canceladas_Report",
            };
            const confirmedCanlledNotas = await this.verifyCancelledNotas.execute(disabledNfes.idsDisabled, configHistoricoNotasCanceladas);
            if (!confirmedCanlledNotas.success) {
                console.error("Erro ao confirmar nfe canceladas no Zoho:", {
                    error: confirmedCanlledNotas.error,
                });
                return 500;
            }
            console.log("Zoho Ids nfe canceladas confirmadas:");
            console.log(confirmedCanlledNotas.idsZohoNotasUpdated);
            const linkNamesCursor = {
                appName: "base-notas-qive",
                formName: "Cursor_NFe_Canceladas",
            };
            const updatedCursor = await this.updateLastCursor.execute(lastZohoCursor, nextCursorQive, linkNamesCursor);
            console.log("Success!");
            console.log(updatedCursor);
            return 200;
        }
        catch (e) {
            console.error("Erro ao atualizar NFe canceladas:", e);
            return 500;
        }
    }
}
exports.default = NFeController;
