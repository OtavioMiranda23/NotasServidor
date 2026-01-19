"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DisableNfses {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(IdsNfsesRequest, reportName) {
        let c = 0;
        console.log({ IdsNfsesRequest });
        for await (const idNfse of IdsNfsesRequest) {
            c++;
            console.log(c);
            if (c % 5 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 10000));
            }
            const nfesFindedToDisable = await this.zoho.findAllItems(reportName, `(IdNota=="${idNfse}")`);
        }
    }
    async cancelNfse(idsZohoToDisable, reportName, payload) {
        const successItemsUpdate = await this.zoho.updateItemsByIds(reportName, payload, idsZohoToDisable);
        if (successItemsUpdate.length !== idsZohoToDisable.length) {
            console.error({ successItemsUpdate });
            console.error({ idsZohoToDisable });
            throw new Error("Nem todas as NFSes foram desabilitadas com sucesso");
        }
        return successItemsUpdate;
    }
    async strategyToDisable(pagamentosFounded, reportName, idsToDisable) {
        if (pagamentosFounded.length === 0) {
            console.log("Nenhum pagamento encontrado para as NFSes informadas.");
            return;
        }
        console.log("Pagamentos encontrados:", pagamentosFounded);
        return;
    }
    async parsePagamento(idsToDisable, reportName) {
        let pagamentosFounded = [];
        for await (const id of idsToDisable) {
            const criteria = `(nfseIds.IdNota.contains(${id}))`;
            const findedItems = await this.zoho.findAllItems(reportName, criteria);
            if (findedItems.success) {
                const pagamentos = findedItems.data;
                const validPagamentos = pagamentos.filter((p) => typeof p.situacao_pagamento === "string" &&
                    typeof p.pagamento_ja_realizado === "string" &&
                    typeof p.pendente === "string" &&
                    typeof p.Enviado_ao_Envio_Notas === "string");
                pagamentosFounded.push(...validPagamentos.map((p) => ({
                    idNota: id,
                    idZoho: p.ID,
                    situacao_pagamento: p.situacao_pagamento,
                    pagamento_ja_realizado: p.pagamento_ja_realizado,
                    pendente: p.pendente,
                    enviadoEnvioNotas: p.Enviado_ao_Envio_Notas,
                })));
            }
        }
        return pagamentosFounded;
    }
}
exports.default = DisableNfses;
