import { z } from "zod";
import GetNFSe from "../application/usecases/getNFSe";
import { IBaseConfigApi } from "../infra/http/zoho/ZohoApi";
import { DataNFe } from "../infra/http/qive/QiveApi";
import { GetCancelledNFSe } from "../application/usecases/getCancelledNFSe";
import DisableNfses from "../application/usecases/disableNfses";

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
  constructor(
    getNFSe: GetNFSe,
    dateToSearch: string | undefined,
    getCancelledNFSe: GetCancelledNFSe,
    disableNfses: DisableNfses
  ) {
    this.getNFSe = getNFSe;
    this.dateToSearch = dateToSearch?.trim() || undefined;
    this.getCancelledNFSe = getCancelledNFSe;
    this.disableNfses = disableNfses;
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

  public async updateCancelledNFSe(cursor: string | undefined | null) {
    if (!cursor) {
      console.error("Cursor inválido para buscar NFSe canceladas");
      throw new Error("Cursor inválido para buscar NFSe canceladas");
    }
    const { cancelledIds, nextCursor } = await this.getCancelledNFSe.execute(
      cursor
    );
    const successItemsUpdate = await this.disableNfses.execute(cancelledIds);
    //encontrar no zoho as notas canceladas
    //mudar a flag desativado para SIM
    //inserir cursor no zoho
  }
}
