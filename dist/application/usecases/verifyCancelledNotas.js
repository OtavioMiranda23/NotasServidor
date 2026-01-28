"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyCancelledNotas = void 0;
class VerifyCancelledNotas {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(notasZohoIds, linkNames) {
        try {
            const content = {
                data: {
                    cancelada: "SIM",
                },
            };
            const updatedNotas = await this.zoho.updateItemsByIds(linkNames.reportName, content, notasZohoIds);
            return { success: true, idsZohoNotasUpdated: updatedNotas };
        }
        catch (error) {
            const errorParsed = JSON.stringify(error);
            return { success: false, idsZohoNotasUpdated: [], error: errorParsed };
        }
    }
}
exports.VerifyCancelledNotas = VerifyCancelledNotas;
