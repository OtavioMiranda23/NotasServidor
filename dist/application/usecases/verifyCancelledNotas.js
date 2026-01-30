"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyCancelledNotas = void 0;
class VerifyCancelledNotas {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(idsDisabled, linkNames) {
        try {
            const contents = [];
            for (const item of idsDisabled) {
                const content = {
                    criteria: `(idNota=="${item.idNota}")`,
                    data: {
                        cancelada: "SIM",
                    },
                };
                contents.push(content);
            }
            const idsNotaUpdated = await this.zoho.updateItemsByIdsWithCriteria(linkNames.reportName, contents);
            console.log(`IDs das notas atualizadas no Zoho: ${JSON.stringify(idsNotaUpdated, null, 2)}`);
            return { success: true, idsZohoNotasUpdated: idsNotaUpdated };
        }
        catch (error) {
            const errorParsed = JSON.stringify(error);
            return { success: false, idsZohoNotasUpdated: [], error: errorParsed };
        }
    }
}
exports.VerifyCancelledNotas = VerifyCancelledNotas;
