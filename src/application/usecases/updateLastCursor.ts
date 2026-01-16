import { th } from "zod/v4/locales";
import { IApiNota, IBaseConfigApi } from "../../infra/http/zoho/ZohoApi";
import { all } from "axios";

export class UpdateLastCursor {
  constructor(readonly zoho: IApiNota) {}

  public async execute(
    qiveCursor: number | null,
    zohoCursor: string | null,
    config: IBaseConfigApi
  ): Promise<void> {
    //verificar o null
    const zohoCursorInt = Number(zohoCursor);
    if (!qiveCursor || qiveCursor <= zohoCursorInt) {
      qiveCursor = zohoCursorInt;
    }
    const content = {
      data: {
        ultimo_cursor: qiveCursor,
      },
    };
    await this.zoho.insertRecord(content, config, 3);
  }
}
