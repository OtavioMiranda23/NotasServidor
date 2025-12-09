import { date, z } from "zod";
import GetNFe from "../application/usecases/getNFe";
import { IBaseConfigApi } from "../infra/http/zoho/ZohoApi";
import { DataNFe } from "../infra/http/qive/QiveApi";

export const DataNFeSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  cursor: z.string().optional(),
  isV2: z.boolean(),
});

export default class NFeController {
  private getNFe: GetNFe;

  constructor(getNFe: GetNFe) {
    this.getNFe = getNFe;
  }

  public async createNFe(errorConfig: IBaseConfigApi) {
    try {
      const [currentDate, _] = new Date().toISOString().split("T");
      const dataNFe = {
        dateFrom: currentDate,
        dateTo: currentDate,
        cursor: "",
        isV2: false,
      };
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
}
