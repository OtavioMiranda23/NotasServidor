import { all } from "axios";
import {
  IApiNota,
  IBaseConfigApi,
  IZohoLinksNames,
} from "../../infra/http/zoho/ZohoApi";
import { Pagamento } from "./disableNfses";
import { FoundedNotasToCancel } from "./verifyCancelledNotas";

export default class DisableNfes {
  constructor(private readonly zoho: IApiNota) {}
  public async execute(
    IdsNfesRequest: string[],
    linkNames: Omit<IZohoLinksNames, "formName">,
    configNotasCanceladas: Omit<IZohoLinksNames, "reportName">,
  ): Promise<{
    idsDisabled: FoundedNotasToCancel[];
    successItemsUpdate: string[];
  }> {
    const idsFoundedInZohoToCancel: FoundedNotasToCancel[] = [];
    for await (const [i, idNfe] of IdsNfesRequest.entries()) {
      console.log(i);
      const allNfesFindedToDisable = await this.zoho.findAllItems(
        linkNames,
        `(id_nota=="NFe${idNfe}")`,
      );
      if (allNfesFindedToDisable.success) {
        const content = {
          data: {
            idNota: idNfe,
            tipoNota: "nfe",
            encontrada: "SIM",
          },
        };
        await this.zoho.saveRecord(content, configNotasCanceladas);
        idsFoundedInZohoToCancel.push({
          idNota: idNfe,
          //@ts-ignore
          idRecord: allNfesFindedToDisable.data[0].ID as string,
        });
      } else {
        const content = {
          data: {
            idNota: idNfe,
            tipoNota: "nfe",
            encontrada: "NAO",
          },
        };
        await this.zoho.saveRecord(content, configNotasCanceladas);
      }
    }
    const linkNamesPagamentos: Omit<IZohoLinksNames, "formName"> = {
      appName: "base-notas-qive",
      reportName: "Documentos_Vinculados_Report",
    };
    const pagamentosFounded = await this.getPagamentosToDisable(
      idsFoundedInZohoToCancel.map((item) => item.idNota),
      linkNamesPagamentos,
    );

    const responseDisable = await this.strategyToDisable(
      pagamentosFounded,
      idsFoundedInZohoToCancel,
    );
    return responseDisable;
    // return successItemsUpdated;
  }

  private async cancelNfe(
    idsToDisable: FoundedNotasToCancel[],
    payload: { data: { [key: string]: string } },
  ): Promise<{
    idsDisabled: FoundedNotasToCancel[];
    successItemsUpdate: string[];
  }> {
    const linkNames: Omit<IZohoLinksNames, "formName"> = {
      appName: "base-notas-qive",
      reportName: "Copy_of_NFe_Report",
    };

    const successItemsUpdate = await this.zoho.updateItemsByIds(
      linkNames.reportName,
      payload,
      idsToDisable.map((item) => item.idRecord),
    );
    if (successItemsUpdate.length !== idsToDisable.length) {
      console.error({ successItemsUpdate });
      console.error({ idsToDisable });
      throw new Error("Nem todas as NFSes foram desabilitadas com sucesso");
    }
    console.log("Notas desativadas com sucesso:");
    console.log(successItemsUpdate);

    return { idsDisabled: idsToDisable, successItemsUpdate };
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
    idsFoundedInZohoToCancel: FoundedNotasToCancel[],
  ): Promise<{
    idsDisabled: FoundedNotasToCancel[];
    successItemsUpdate: string[];
  }> {
    const pagamentosFoundedList = pagamentosFounded.map((p) => p.idNota);
    const idsNfeNaoVinculadas = idsFoundedInZohoToCancel.filter((item) => {
      return !pagamentosFoundedList.includes(item.idNota);
    });
    console.log("pagamentos encontrados", pagamentosFounded.length);
    console.log("idsFoundedInZohoToCancel:", idsFoundedInZohoToCancel.length);
    console.log("idsNfeNaoVinculadas:", idsNfeNaoVinculadas.length);
    console.log("idsNfeNaoVinculadas length:", idsNfeNaoVinculadas);
    if (idsNfeNaoVinculadas.length === 0) {
      console.log("Todas as NFes possuem pagamentos vinculados.");
      return { idsDisabled: [], successItemsUpdate: [] };
    }
    const payload = { data: { desativado: "SIM" } };
    const successItemsUpdate = await this.cancelNfe(
      idsNfeNaoVinculadas,
      payload,
    );
    return successItemsUpdate;
    // return { successItemsUpdate: [] };
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
      const criteria = `(nfeIds.id_nota.contains("NFe${id}"))`;
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
