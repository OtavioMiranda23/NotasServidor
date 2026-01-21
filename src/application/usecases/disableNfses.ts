import {
  IApiNota,
  IBaseConfigApi,
  IZohoLinksNames,
} from "../../infra/http/zoho/ZohoApi";

type Pagamento = {
  ID: string;
  situacao_pagamento?: string;
  pagamento_ja_realizado?: string;
  pendente?: string;
  Enviado_ao_Envio_Notas?: string;
};

type FoundedNfseToCancel = {
  idNfse: string;
  idRecord: string;
};

export default class DisableNfses {
  constructor(private readonly zoho: IApiNota) {}
  public async execute(
    IdsNfsesRequest: string[],
    linkNames: Omit<IZohoLinksNames, "formName">,
    configNotasCanceladas: Omit<IZohoLinksNames, "reportName">,
  ) {
    const idsFoundedInZohoToCancel: FoundedNfseToCancel[] = [];
    console.log({ IdsNfsesRequest });
    for await (const [i, idNfse] of IdsNfsesRequest.entries()) {
      if (i < 3) {
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
            //@ts-ignore
            idRecord: allNfesFindedToDisable.data[0].ID as string,
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
    }
    const linkNamesPagamentos: Omit<IZohoLinksNames, "formName"> = {
      appName: "base-notas-qive",
      reportName: "Documentos_Vinculados_Report",
    };
    const pagamentosFounded = await this.getPagamentosToDisable(
      idsFoundedInZohoToCancel.map((item) => item.idNfse),
      linkNamesPagamentos,
    );
    console.log({ pagamentosFounded });
    const successItemsUpdated = await this.strategyToDisable(
      pagamentosFounded,
      linkNamesPagamentos,
      idsFoundedInZohoToCancel,
    );
    // return successItemsUpdated;
  }

  private async cancelNfse(
    idsRecordToDisable: string[],
    linkNames: Omit<IZohoLinksNames, "formName">,
    payload: { data: { [key: string]: string } },
  ) {
    console.log({ idsRecordToDisable, linkNames, payload });
    // const successItemsUpdate = await this.zoho.updateItemsByIds(
    //   linkNames.reportName,
    //   payload,
    //   idsRecordToDisable,
    // );
    // if (successItemsUpdate.length !== idsRecordToDisable.length) {
    //   console.error({ successItemsUpdate });
    //   console.error({ idsRecordToDisable });
    //   throw new Error("Nem todas as NFSes foram desabilitadas com sucesso");
    // }
    // return successItemsUpdate;
  }
  private async strategyToDisable(
    pagamentosFounded: {
      idNota: string;
      idZoho: string;
      situacao_pagamento: string;
      pagamento_ja_realizado: string;
      pendente: string;
      enviadoEnvioNotas: string;
    }[],
    linkNames: Omit<IZohoLinksNames, "formName">,
    idsFoundedInZohoToCancel: FoundedNfseToCancel[],
  ) {
    console.log("Entrou na strategyToDisable");
    //pegar ids que não possuem pagamento vinculado
    //iterar nos ids, verificar se em cada id há algum pagamento com o id de nfse igual
    const idsNfseNaoVinculadas = idsFoundedInZohoToCancel.filter((item) => {
      const isNfseNotInPagamentos = pagamentosFounded.some(
        (pagamento) => pagamento.idNota !== item.idNfse,
      );
      return isNfseNotInPagamentos;
    });
    console.log({ idsNfseNaoVinculadas });
    const payload = { data: { Desativado: "SIM" } };
    await this.cancelNfse(
      idsNfseNaoVinculadas.map((item) => item.idRecord),
      linkNames,
      payload,
    );
    // if (pagamentoNaoVinculado) {
    //   console.log("Nenhum pagamento encontrado para as NFSes informadas.");
    //
    // return;
    // const successItemsUpdated = await this.cancelNfse(
    //   idsToDisable,
    //   reportName,
    //   { data: { Desativado: "SIM" } }
    // );
    // return successItemsUpdated;
    // }
    // console.log("Pagamentos encontrados:", pagamentosFounded);
    // return;
    // pagamentosFounded.forEach((pagamento) => {
    //   if (pagamento.situacao_pagamento === "pendente") {
    //     //bloquear aprovação
    //   }
    // });
  }

  private async getPagamentosToDisable(
    idsToDisable: string[],
    linkNames: Omit<IZohoLinksNames, "formName">,
  ) {
    let pagamentosFounded: {
      idNota: string;
      idZoho: string;
      situacao_pagamento: string;
      pagamento_ja_realizado: string;
      pendente: string;
      enviadoEnvioNotas: string;
    }[] = [];
    console.log("idsToDisable:");
    console.log(idsToDisable);
    for await (const id of idsToDisable) {
      const criteria = `(nfseIds.IdNota.contains("${id}"))`;
      const findedItems = await this.zoho.findAllItems(linkNames, criteria);
      if (findedItems.success) {
        const pagamentos = findedItems.data as Pagamento[];
        const validPagamentos = pagamentos.filter(
          (
            p,
          ): p is Pagamento & {
            situacao_pagamento: string;
            pagamento_ja_realizado: string;
            pendente: string;
            Enviado_ao_Envio_Notas: string;
          } =>
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
