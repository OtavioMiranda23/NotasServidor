import { IApiNota } from "../../infra/http/zoho/ZohoApi";

export class GetLastCursor {
  constructor(private readonly zoho: IApiNota) {}

  async execute(reportName: string): Promise<number | null> {
    const allCursors = await this.zoho.findAllItems(reportName);
    if (!allCursors.success) {
      return null;
    }
    if (allCursors.data.length === 0) {
      return null;
    }

    const first = (allCursors.data as { ultimo_cursor: number }[])[0];
    return first.ultimo_cursor as number;
  }
}
