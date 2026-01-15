"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DisableNfses {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(IdsNfsesRequest) {
        const reportName = "Copy_of_NFSe_Report";
        const nfesFindedToDisable = await this.zoho.findItemsByIds(reportName, IdsNfsesRequest);
        const idsToDisable = nfesFindedToDisable.map((nfse) => nfse["ID"]);
        const payload = { data: { Desativado: "SIM" } };
        const successItemsUpdate = await this.zoho.updateItemsByIds(reportName, payload, idsToDisable);
        if (successItemsUpdate.length !== idsToDisable.length) {
            console.error({ successItemsUpdate });
            console.error({ idsToDisable });
            throw new Error("Nem todas as NFSes foram desabilitadas com sucesso");
        }
        return successItemsUpdate;
    }
}
exports.default = DisableNfses;
