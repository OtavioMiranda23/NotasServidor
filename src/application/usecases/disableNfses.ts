import { IApiNota } from "../../infra/http/zoho/ZohoApi";

export default class DisableNfses {
  constructor(private readonly zoho: IApiNota) {}
  public async execute(IdsNfsesRequest: string[]) {
    const reportName = "Copy_of_NFSe_Report";
    const nfesFindedToDisable = await this.zoho.findItemsByIds(
      reportName,
      IdsNfsesRequest
    );
    const idsToDisable: string[] = nfesFindedToDisable.map(
      (nfse) => nfse["ID"] as string
    );
    const payload = { data: { Desativado: "SIM" } };
    const successItemsUpdate = await this.zoho.updateItemsByIds(
      reportName,
      payload,
      idsToDisable
    );
    if (successItemsUpdate.length !== idsToDisable.length) {
      console.error({ successItemsUpdate });
      console.error({ idsToDisable });
      throw new Error("Nem todas as NFSes foram desabilitadas com sucesso");
    }
    return successItemsUpdate;
  }
}
