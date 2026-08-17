import { z } from "zod";
import GetNFSe from "../application/usecases/getNFSe";
import { IBaseConfigApi, IZohoLinksNames } from "../infra/http/zoho/ZohoApi";
import { GetCancelledNFSe } from "../application/usecases/getCancelledNFSe";
import DisableNfses from "../application/usecases/disableNfses";
import { UpdateLastCursor } from "../application/usecases/updateLastCursor";
import { GetLastCursor } from "../application/usecases/getLastCursor";
import { ca } from "zod/v4/locales";
import { VerifyCancelledNotas } from "../application/usecases/verifyCancelledNotas";

export const DataNFSeSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  cursor: z.string().optional(),
  isV2: z.boolean(),
});

export default class NFSeController {
  private getNFSe: GetNFSe;
  private getCancelledNFSe: GetCancelledNFSe;
  private dateToSearch: string | undefined;
  private disableNfses: DisableNfses;
  private getLastCursor: GetLastCursor;
  private updateLastCursor: UpdateLastCursor;
  private verifyCancelledNotas: VerifyCancelledNotas;
  constructor(
    getNFSe: GetNFSe,
    dateToSearch: string | undefined,
    getCancelledNFSe: GetCancelledNFSe,
    disableNfses: DisableNfses,
    getLastCursor: GetLastCursor,
    updateLastCursor: UpdateLastCursor,
    verifyCancelledNotas: VerifyCancelledNotas,
  ) {
    this.getNFSe = getNFSe;
    this.dateToSearch = dateToSearch?.trim() || undefined;
    this.getCancelledNFSe = getCancelledNFSe;
    this.disableNfses = disableNfses;
    this.getLastCursor = getLastCursor;
    this.updateLastCursor = updateLastCursor;
    this.verifyCancelledNotas = verifyCancelledNotas;
  }

  public async createNFSe(errorConfig: IBaseConfigApi) {
    try {
      const today = new Date();
      const fromDateRaw = new Date(today);
      fromDateRaw.setUTCDate(fromDateRaw.getUTCDate() - 7);
      const [fromDate, __] = fromDateRaw.toISOString().split("T");
      const [currentDate, _] = new Date().toISOString().split("T");
      const input = {
        // dateFrom: this.dateToSearch || fromDate,
        // dateTo: this.dateToSearch || currentDate,
        dateFrom: this.dateToSearch || fromDate,
        dateTo: this.dateToSearch || currentDate,

        cursor: "",
        isV2: false,
      };
      console.log(`RODANDO COM O INPUT:`);
      console.log(input);

      const dataResult = await this.getNFSe.execute(input, errorConfig);
      const result = {
        data: dataResult,
        message: "NFSe processada com sucesso",
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

  public async updateCancelledNFSe() {
    try {
      const linksNames: Omit<IZohoLinksNames, "formName"> = {
        appName: "base-notas-qive",
        reportName: "Cursor_NFSe_Canceladas_Report",
      };
      const lastZohoCursor: number | null =
        await this.getLastCursor.execute(linksNames);
      console.log("lastZohoCursor nfse::::", lastZohoCursor);
      const { cancelledIds, nextCursorQive } =
        await this.getCancelledNFSe.execute(lastZohoCursor);
      console.log("cancelledIds nfse recebidos::::", cancelledIds.length);

      if (cancelledIds.length === 0) {
        console.log("Nenhuma NFSe foi desabilitada.");
        return 204;
      }
      const linkNamesToDisable: Omit<IZohoLinksNames, "formName"> = {
        appName: "base-notas-qive",
        reportName: "Copy_of_NFSe_Report",
      };
      const configNotasCanceladas: Omit<IZohoLinksNames, "reportName"> = {
        appName: "base-notas-qive",
        formName: "Historico_Notas_Canceladas",
      };
      const disabledNfses = await this.disableNfses.execute(
        cancelledIds,
        linkNamesToDisable,
        configNotasCanceladas,
      );

      const configHistoricoNotasCanceladas: Omit<IZohoLinksNames, "formName"> =
        {
          appName: "base-notas-qive",
          reportName: "Historico_Notas_Canceladas_Report",
        };
      const confirmedCancelledNotas = await this.verifyCancelledNotas.execute(
        disabledNfses.idsDisabled,
        configHistoricoNotasCanceladas,
      );
      if (!confirmedCancelledNotas.success) {
        console.error("Erro ao confirmar nfse canceladas no Zoho:", {
          error: confirmedCancelledNotas.error,
        });
        return 500;
      }
      console.log("Zoho Ids nfse canceladas confirmadas:");
      console.log(confirmedCancelledNotas.idsZohoNotasUpdated);
      const linkNamesCursor: Omit<IZohoLinksNames, "reportName"> = {
        appName: "base-notas-qive",
        formName: "Cursor_NFSe_Canceladas",
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
      console.error("Erro ao atualizar NFSe canceladas:");
      console.error(e);
      return 500;
    }
  }
}
