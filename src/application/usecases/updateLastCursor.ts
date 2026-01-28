import { th } from "zod/v4/locales";
import {
  IApiNota,
  IBaseConfigApi,
  IZohoLinksNames,
} from "../../infra/http/zoho/ZohoApi";
import { all } from "axios";

export class UpdateLastCursor {
  constructor(readonly zoho: IApiNota) {}

  public async execute(
    qiveCursor: number | null,
    zohoCursor: string | null,
    config: Omit<IZohoLinksNames, "reportName">,
  ): Promise<{ cursorUpdated: boolean; lastCursor: { result: unknown[] } }> {
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
    const savedRecords = await this.zoho.saveRecord(content, config);
    return { cursorUpdated: true, lastCursor: savedRecords };
  }
}
