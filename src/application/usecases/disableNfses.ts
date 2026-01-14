import { IApiNota } from "../../infra/http/zoho/ZohoApi";

class disableNfses {
  constructor(private readonly zoho: IApiNota) {}
  public async execute(IdsNfsesRequest: string[]) {
    const reportName = "Copy_of_NFSe_Report";
    const nfes = await this.zoho.findItemsByIds(reportName, IdsNfsesRequest);
    return nfes;
  }
}
