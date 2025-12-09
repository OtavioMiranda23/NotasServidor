import { z } from "zod";
import GetNFSe from "../application/usecases/getNFSe";
import { IBaseConfigApi } from "../infra/http/zoho/ZohoApi";
import { DataNFe } from "../infra/http/qive/QiveApi";

export const DataNFSeSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  cursor: z.string().optional(),
  isV2: z.boolean(),
});

export default class NFSeController {
  private getNFSe: GetNFSe;

  constructor(getNFSe: GetNFSe) {
    this.getNFSe = getNFSe;
  }

  public async createNFSe(errorConfig: IBaseConfigApi) {
    try {
      const [currentDate, _] = new Date().toISOString().split("T");
      const input = {
        dateFrom: currentDate,
        dateTo: currentDate,
        cursor: "",
        isV2: false,
      };

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
}
