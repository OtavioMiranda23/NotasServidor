import axios from "axios";
import QiveApi, { CredentialsQive } from "../../infra/http/qive/QiveApi";
export type QiveNfseEventsResponse = {
  status: {
    code: number;
    message: string;
  };
  data: Array<{
    id: string;
    type: string;
    /** Base64 (conforme exemplo da API) */
    xml: string;
  }>;
  page: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  signature: string;
};

export class GetCancelledNFSe {
  public constructor(private qive: QiveApi) {}
  public async execute(cursor: number | null) {
    try {
      const content: QiveNfseEventsResponse = await this.qive.getCancelledNFSe(
        cursor?.toString() || null,
      );
      const cancelledIds = content.data.map((item) => item.id);
      if (content.count > 49) {
        console.error(
          "Limite de notas canceladas excedido. Verifique o cursor inserido",
        );
        throw new Error(
          "Limite de notas canceladas excedido. Verifique o cursor inserido",
        );
      }
      return {
        cancelledIds,
        nextCursorQive: this.extractCursorFromUrl(content),
      };
    } catch (error) {
      console.error("Erro ao buscar nfse canceladas:", error);
      throw new Error("Erro ao buscar nfse canceladas");
    }
  }

  extractCursorFromUrl(url: { page: { next: string | null } }): string | null {
    let nextCursor: string | null = null;
    if (url.page.next) {
      const nextUrl = url.page.next;
      const match = nextUrl.match(/cursor=([^&]+)/);
      if (match && match[1]) {
        nextCursor = match[1];
      }
    }
    return nextCursor;
  }
}
