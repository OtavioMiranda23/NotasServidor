"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DisableNfses {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(IdsNfsesRequest, linkNames, configNotasCanceladas) {
        const idsFoundedInZohoToCancel = [];
        console.log({ IdsNfsesRequest });
        for await (const [i, idNfse] of IdsNfsesRequest.entries()) {
            if (i < 3) {
                console.log(i);
                const allNfesFindedToDisable = await this.zoho.findAllItems(linkNames, `(IdNota=="${idNfse}")`);
                if (allNfesFindedToDisable.success) {
                    const content = {
                        data: {
                            idNota: idNfse,
                            tipoNota: "nfse",
                            encontrada: "SIM",
                        },
                    };
                    await this.zoho.saveRecord(content, configNotasCanceladas);
                    idsFoundedInZohoToCancel.push({
                        idNfse,
                        idRecord: allNfesFindedToDisable.data[0].ID,
                    });
                }
                else {
                    const content = {
                        data: {
                            idNota: idNfse,
                            tipoNota: "nfse",
                            encontrada: "NAO",
                        },
                    };
                    await this.zoho.saveRecord(content, configNotasCanceladas);
                }
            }
        }
        const linkNamesPagamentos = {
            appName: "base-notas-qive",
            reportName: "Documentos_Vinculados_Report",
        };
        const pagamentosFounded = await this.getPagamentosToDisable(idsFoundedInZohoToCancel.map((item) => item.idNfse), linkNamesPagamentos);
        console.log({ pagamentosFounded });
        const successItemsUpdated = await this.strategyToDisable(pagamentosFounded, linkNamesPagamentos, idsFoundedInZohoToCancel);
    }
    async cancelNfse(idsRecordToDisable, linkNames, payload) {
        console.log({ idsRecordToDisable, linkNames, payload });
    }
    async strategyToDisable(pagamentosFounded, linkNames, idsFoundedInZohoToCancel) {
        console.log("Entrou na strategyToDisable");
        const idsNfseNaoVinculadas = idsFoundedInZohoToCancel.filter((item) => {
            const isNfseNotInPagamentos = pagamentosFounded.some((pagamento) => pagamento.idNota !== item.idNfse);
            return isNfseNotInPagamentos;
        });
        console.log({ idsNfseNaoVinculadas });
        const payload = { data: { Desativado: "SIM" } };
        await this.cancelNfse(idsNfseNaoVinculadas.map((item) => item.idRecord), linkNames, payload);
    }
    async getPagamentosToDisable(idsToDisable, linkNames) {
        let pagamentosFounded = [];
        console.log("idsToDisable:");
        console.log(idsToDisable);
        for await (const id of idsToDisable) {
            const criteria = `(nfseIds.IdNota.contains("${id}"))`;
            const findedItems = await this.zoho.findAllItems(linkNames, criteria);
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
