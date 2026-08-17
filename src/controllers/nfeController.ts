import { date, z } from "zod";
import GetNFe from "../application/usecases/getNFe";
import { IBaseConfigApi, IZohoLinksNames } from "../infra/http/zoho/ZohoApi";
import { DataNFe } from "../infra/http/qive/QiveApi";
import DisableNfses from "../application/usecases/disableNfses";
import { GetLastCursor } from "../application/usecases/getLastCursor";
import { UpdateLastCursor } from "../application/usecases/updateLastCursor";
import { GetCancelledNFe } from "../application/usecases/getCancelledNFe";
import DisableNfes from "../application/usecases/disableNfes";
import { VerifyCancelledNotas } from "../application/usecases/verifyCancelledNotas";

export const DataNFeSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  cursor: z.string().optional(),
  isV2: z.boolean(),
});

export default class NFeController {
  private getNFe: GetNFe;
  private dateToSearch: string | undefined;
  private getCancelledNFe: GetCancelledNFe;
  private disableNfes: DisableNfes;
  private getLastCursor: GetLastCursor;
  private updateLastCursor: UpdateLastCursor;
  private verifyCancelledNotas: VerifyCancelledNotas;
  constructor(
    getNFe: GetNFe,
    dateToSearch: string | undefined,
    getCancelledNFe: GetCancelledNFe,
    disableNfes: DisableNfes,
    getLastCursor: GetLastCursor,
    updateLastCursor: UpdateLastCursor,
    verifyCancelledNotas: VerifyCancelledNotas,
  ) {
    this.getNFe = getNFe;
    this.dateToSearch = dateToSearch?.trim() || undefined;
    this.getCancelledNFe = getCancelledNFe;
    this.disableNfes = disableNfes;
    this.getLastCursor = getLastCursor;
    this.updateLastCursor = updateLastCursor;
    this.verifyCancelledNotas = verifyCancelledNotas;
  }

  public async createNFe(errorConfig: IBaseConfigApi) {
    try {
      const today = new Date();
      const fromDateRaw = new Date(today);
      fromDateRaw.setUTCDate(fromDateRaw.getUTCDate() - 7);
      const [fromDate, __] = fromDateRaw.toISOString().split("T");
      const [currentDate, _] = new Date().toISOString().split("T");
      const dataNFe = {
        dateFrom: this.dateToSearch || fromDate,
        dateTo: this.dateToSearch || currentDate,
        cursor: "",
        isV2: false,
      };
      console.log(`RODANDO COM O INPUT:`);
      console.log(dataNFe);

      const dataNFeRaw = dataNFe as DataNFe;
      const dataResult = await this.getNFe.execute(dataNFeRaw, errorConfig);
      const result = {
        data: dataResult,
        message: "NFe processada com sucesso",
      };
      return {
        status: 200,
        data: result,
      };
    } catch (e: any) {
      return {
        status: e.statusCode || 500,
        error: {
          message: e.message || "Erro interno do servidor",
          code: e.code || undefined,
          data: e.data || undefined,
          timeStamp: new Date().toISOString(),
        },
      };
    }
  }

  public async updateCancelledNFe() {
    try {
      const linksNames: Omit<IZohoLinksNames, "formName"> = {
        appName: "base-notas-qive",
        reportName: "Cursor_NFe_Canceladas_Report",
      };
      const lastZohoCursor: number | null =
        await this.getLastCursor.execute(linksNames);
      const { cancelledIds, nextCursorQive } =
        await this.getCancelledNFe.execute(lastZohoCursor);
      console.log("cancelledIds nfe recebidos::::", cancelledIds.length);
      if (cancelledIds.length === 0) {
        console.log("Nenhuma NFe foi desabilitada.");
        return 204;
      }
      console.log("cancelledIds:", { cancelledIds, nextCursorQive });
      // // //verificar se o pagamento está pendente
      const linkNamesToDisable: Omit<IZohoLinksNames, "formName"> = {
        appName: "base-notas-qive",
        reportName: "Copy_of_NFe_Report",
      };
      const configNotasCanceladas: Omit<IZohoLinksNames, "reportName"> = {
        appName: "base-notas-qive",
        formName: "Historico_Notas_Canceladas",
      };
      const disabledNfes = await this.disableNfes.execute(
        cancelledIds,
        linkNamesToDisable,
        configNotasCanceladas,
      );

      const configHistoricoNotasCanceladas: Omit<IZohoLinksNames, "formName"> =
        {
          appName: "base-notas-qive",
          reportName: "Historico_Notas_Canceladas_Report",
        };
      const confirmedCanlledNotas = await this.verifyCancelledNotas.execute(
        disabledNfes.idsDisabled,
        configHistoricoNotasCanceladas,
      );
      if (!confirmedCanlledNotas.success) {
        console.error("Erro ao confirmar nfe canceladas no Zoho:", {
          error: confirmedCanlledNotas.error,
        });
        return 500;
      }
      console.log("Zoho Ids nfe canceladas confirmadas:");
      console.log(confirmedCanlledNotas.idsZohoNotasUpdated);
      const linkNamesCursor: Omit<IZohoLinksNames, "reportName"> = {
        appName: "base-notas-qive",
        formName: "Cursor_NFe_Canceladas",
      };
      const updatedCursor = await this.updateLastCursor.execute(
        lastZohoCursor,
        nextCursorQive,
        linkNamesCursor,
      );
      console.log("Success!");
      console.log(updatedCursor);
      return 200;
    } catch (e) {
      console.error("Erro ao atualizar NFe canceladas:", e);
      return 500;
    }
  }
}
