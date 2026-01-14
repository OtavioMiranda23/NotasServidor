"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DisableNfses {
  constructor(zoho) {
    this.zoho = zoho;
  }
  async execute(IdsNfsesRequest, linkNames, configNotasCanceladas) {
    const idsFoundedInZohoToCancel = [];
    for await (const [i, idNfse] of IdsNfsesRequest.entries()) {
      console.log(i);
      const allNfesFindedToDisable = await this.zoho.findAllItems(
        linkNames,
        `(IdNota=="${idNfse}")`,
      );
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
      } else {
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
    const linkNamesPagamentos = {
      appName: "base-notas-qive",
      reportName: "Documentos_Vinculados_Report",
    };
    const pagamentosFounded = await this.getPagamentosToDisable(
      idsFoundedInZohoToCancel.map((item) => item.idNfse),
      linkNamesPagamentos,
    );
    const responseDisable = await this.strategyToDisable(
      pagamentosFounded,
      idsFoundedInZohoToCancel,
    );
    return responseDisable;
  }
  async cancelNfse(idsRecordToDisable, payload) {
    const linkNames = {
      appName: "base-notas-qive",
      reportName: "Copy_of_NFSe_Report",
    };
    const successItemsUpdate = await this.zoho.updateItemsByIds(
      linkNames.reportName,
      payload,
      idsRecordToDisable,
    );
    if (successItemsUpdate.length !== idsRecordToDisable.length) {
      console.error({ successItemsUpdate });
      console.error({ idsRecordToDisable });
      throw new Error("Nem todas as NFSes foram desabilitadas com sucesso");
    }
    console.log("Notas desativadas com sucesso:");
    console.log(successItemsUpdate);
    return { successItemsUpdate };
  }
  async strategyToDisable(pagamentosFounded, idsFoundedInZohoToCancel) {
    const ppagamentosFoundedList = pagamentosFounded.map((p) => p.idNota);
    const idsNfseNaoVinculadas = idsFoundedInZohoToCancel.filter((item) => {
      return !ppagamentosFoundedList.includes(item.idNfse);
    });
    console.log("pagamentos encontrados", pagamentosFounded.length);
    console.log("idsFoundedInZohoToCancel:", idsFoundedInZohoToCancel.length);
    console.log("idsNfseNaoVinculadas:", idsNfseNaoVinculadas.length);
    console.log("idsNfseNaoVinculadas length:", idsNfseNaoVinculadas);
    if (idsNfseNaoVinculadas.length === 0) {
      console.log("Todas as NFSes possuem pagamentos vinculados.");
      return { successItemsUpdate: [] };
    }
    const payload = { data: { desativado: "SIM" } };
    const successItemsUpdate = await this.cancelNfse(
      idsNfseNaoVinculadas.map((item) => item.idRecord),
      payload,
    );
    return successItemsUpdate;
  }
  async getPagamentosToDisable(idsToDisable, linkNames) {
    let pagamentosFounded = [];
    for await (const id of idsToDisable) {
      const criteria = `(nfseIds.IdNota.contains("${id}"))`;
      const findedItems = await this.zoho.findAllItems(linkNames, criteria);
      if (findedItems.success) {
        const pagamentos = findedItems.data;
        const validPagamentos = pagamentos.filter(
          (p) =>
            typeof p.situacao_pagamento === "string" &&
            typeof p.pagamento_ja_realizado === "string" &&
            typeof p.pendente === "string" &&
            typeof p.Enviado_ao_Envio_Notas === "string",
        );
        pagamentosFounded.push(
          ...validPagamentos.map((p) => ({
            idNota: id,
            idZoho: p.ID,
            situacao_pagamento: p.situacao_pagamento,
            pagamento_ja_realizado: p.pagamento_ja_realizado,
            pendente: p.pendente,
            enviadoEnvioNotas: p.Enviado_ao_Envio_Notas,
          })),
        );
      }
    }
    return pagamentosFounded;
  }
}
exports.default = DisableNfses;
