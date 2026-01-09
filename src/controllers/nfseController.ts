import { z } from "zod";
import GetNFSe from "../application/usecases/getNFSe";
import { IBaseConfigApi } from "../infra/http/zoho/ZohoApi";
import { DataNFe } from "../infra/http/qive/QiveApi";
import { GetCancelledNFSe } from "../application/usecases/getCancelledNFSe";
import DisableNfses from "../application/usecases/disableNfses";
import { UpdateLastCursor } from "../application/usecases/updateLastCursor";
import { GetLastCursor } from "../application/usecases/getLastCursor";

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
  constructor(
    getNFSe: GetNFSe,
    dateToSearch: string | undefined,
    getCancelledNFSe: GetCancelledNFSe,
    disableNfses: DisableNfses,
    getLastCursor: GetLastCursor,
    updateLastCursor: UpdateLastCursor,
  ) {
    this.getNFSe = getNFSe;
    this.dateToSearch = dateToSearch?.trim() || undefined;
    this.getCancelledNFSe = getCancelledNFSe;
    this.disableNfses = disableNfses;
    this.getLastCursor = getLastCursor;
    this.updateLastCursor = updateLastCursor;
  }

  public async createNFSe(errorConfig: IBaseConfigApi) {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const [yesterdayDate, __] = yesterday.toISOString().split("T");
      const [currentDate, _] = new Date().toISOString().split("T");
      const input = {
        dateFrom: this.dateToSearch || yesterdayDate,
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
    const formReportNames: IBaseConfigApi = {
      formName: "Cursor_NFSe_Canceladas",
      tableName: "Cursor_NFSe_Canceladas_Report",
    };
    const lastZohoCursor: number | null = await this.getLastCursor.execute(
      formReportNames.tableName,
    );
    const { cancelledIds, nextCursorQive } =
      await this.getCancelledNFSe.execute(lastZohoCursor);
    // //verificar se o pagamento está pendente
    const reportName = "Copy_of_NFSe_Report";

    const disabledNfses = await this.disableNfses.execute(
      cancelledIds,
      reportName,
    );
    // await this.updateLastCursor.execute(
    //   lastZohoCursor,
    //   nextCursorQive,
    //   formReportNames
    // );
  }
}
