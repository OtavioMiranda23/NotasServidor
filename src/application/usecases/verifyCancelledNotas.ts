import { id } from "zod/v4/locales";
import ZohoApi, { IZohoLinksNames } from "../../infra/http/zoho/ZohoApi";
import { FoundedNfseToCancel } from "./disableNfses";

export class VerifyCancelledNotas {
  constructor(private readonly zoho: ZohoApi) {}

  public async execute(
    idsDisabled: FoundedNfseToCancel[],
    linkNames: Omit<IZohoLinksNames, "formName">,
  ): Promise<{ success: boolean; idsZohoNotasUpdated: string[]; error?: any }> {
    try {
      let updatedNotas: string[] = [];
      const contents = [];
      for (const item of idsDisabled) {
        const content = {
          criteria: `(idNota=="${item.idNfse}")`,
          data: {
            cancelada: "SIM",
          },
        };
        contents.push(content);
      }
      const idsNotaUpdated = await this.zoho.updateItemsByIdsWithCriteria(
        linkNames.reportName,
        contents,
      );
      console.log(
        `IDs das notas atualizadas no Zoho: ${JSON.stringify(idsNotaUpdated, null, 2)}`,
      );

      return { success: true, idsZohoNotasUpdated: idsNotaUpdated };
    } catch (error) {
      const errorParsed = JSON.stringify(error);
      return { success: false, idsZohoNotasUpdated: [], error: errorParsed };
    }
  }
}
