import ZohoApi, { IZohoLinksNames } from "../../infra/http/zoho/ZohoApi";

export class VerifyCancelledNotas {
  constructor(private readonly zoho: ZohoApi) {}

  public async execute(
    notasZohoIds: string[],
    linkNames: Omit<IZohoLinksNames, "formName">,
  ): Promise<{ success: boolean; idsZohoNotasUpdated: string[]; error?: any }> {
    try {
      const content = {
        data: {
          cancelada: "SIM",
        },
      };
      const updatedNotas = await this.zoho.updateItemsByIds(
        linkNames.reportName,
        content,
        notasZohoIds,
      );
      return { success: true, idsZohoNotasUpdated: updatedNotas };
    } catch (error) {
      const errorParsed = JSON.stringify(error);
      return { success: false, idsZohoNotasUpdated: [], error: errorParsed };
    }
  }
}
