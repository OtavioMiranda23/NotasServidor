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

export default class DisableNfses {
  constructor(private readonly zoho: IApiNota) {}
  public async execute(
    IdsNfsesRequest: string[],
    linkNames: Omit<IZohoLinksNames, "formName">,
    configNotasCanceladas: Omit<IZohoLinksNames, "reportName">,
  ) {
    const idsNfseFoundedInZohoToCancel: string[] = [];
    let c = 0;
    console.log({ IdsNfsesRequest });
    for await (const idNfse of IdsNfsesRequest) {
      c++;
      console.log(c);
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
        idsNfseFoundedInZohoToCancel.push(idNfse);
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
    const pagamentosFounded = await this.getPagamentosToDisable(
      idsNfseFoundedInZohoToCancel,
      linkNames,
    );
    console.log({ pagamentosFounded });
    // const successItemsUpdated = await this.strategyToDisable(
    //   pagamentosFounded,
    //   reportName,
    //   idsToDisable
    // );
    // return successItemsUpdated;
  }

  private async cancelNfse(
    idsZohoToDisable: string[],
    reportName: string,
    payload: { data: { [key: string]: string } },
  ) {
    // const payload = { data: { Desativado: "SIM" } };
    const successItemsUpdate = await this.zoho.updateItemsByIds(
      reportName,
      payload,
      idsZohoToDisable,
    );

    if (successItemsUpdate.length !== idsZohoToDisable.length) {
      console.error({ successItemsUpdate });
      console.error({ idsZohoToDisable });
      throw new Error("Nem todas as NFSes foram desabilitadas com sucesso");
    }
    return successItemsUpdate;
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
    reportName: string,
    idsToDisable: string[],
  ) {
    if (pagamentosFounded.length === 0) {
      console.log("Nenhum pagamento encontrado para as NFSes informadas.");
      return;
      // const successItemsUpdated = await this.cancelNfse(
      //   idsToDisable,
      //   reportName,
      //   { data: { Desativado: "SIM" } }
      // );
      // return successItemsUpdated;
    }
    console.log("Pagamentos encontrados:", pagamentosFounded);
    return;
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
    for await (const id of idsToDisable) {
      const criteria = `(nfseIds.IdNota.contains(${id}))`;
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
