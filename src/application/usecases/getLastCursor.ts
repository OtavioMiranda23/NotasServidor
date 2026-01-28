import { IApiNota, IZohoLinksNames } from "../../infra/http/zoho/ZohoApi";

export class GetLastCursor {
  constructor(private readonly zoho: IApiNota) {}

  async execute(
    linksNames: Omit<IZohoLinksNames, "formName">,
  ): Promise<number | null> {
    const allCursors = await this.zoho.findAllItems(linksNames);
    if (!allCursors.success || allCursors.data.length === 0) {
      return null;
    }
    const first = (allCursors.data as { ultimo_cursor: number }[])[0];
    return first.ultimo_cursor as number;
  }
}
