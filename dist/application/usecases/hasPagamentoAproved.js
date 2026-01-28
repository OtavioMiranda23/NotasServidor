"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HasPagamentoAproved = void 0;
class HasPagamentoAproved {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(reportName, nfseIds) {
        const pagamentosFounded = [];
        for await (const id of nfseIds) {
            const criteria = `(nfseIds.IdNota.contains(${id}))`;
            const findedItems = await this.zoho.findAllItems(reportName, criteria);
            if (findedItems.success) {
                const pagamentos = findedItems.data;
            }
        }
    }
}
exports.HasPagamentoAproved = HasPagamentoAproved;
