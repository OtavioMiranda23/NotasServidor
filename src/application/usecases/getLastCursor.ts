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
    //   [
    // {
    //   ultimo_cursor: '1073',
    //   ID: '3938561000114592203',
    //   Added_Time: '02-Feb-2026 00:58:42'
    // },
    // {
    //   ultimo_cursor: '1072',
    //   ID: '3938561000114589024',
    //   Added_Time: '01-Feb-2026 16:57:31'
    // },
    (allCursors.data as { Added_Time: string; ultimo_cursor: number }[]).sort(
      (a, b) => {
        if (a.Added_Time && b.Added_Time) {
          return (
            new Date(b.Added_Time).getTime() - new Date(a.Added_Time).getTime()
          );
        }
        return 0;
      },
    );
    const first = (allCursors.data as { ultimo_cursor: number }[])[0];
    return first.ultimo_cursor as number;
  }
}
