"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class disableNfses {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(IdsNfsesRequest) {
        const reportName = "Copy_of_NFSe_Report";
        const nfes = await this.zoho.findItemsByIds(reportName, IdsNfsesRequest);
        return nfes;
    }
}
