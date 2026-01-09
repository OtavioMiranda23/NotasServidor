import axios from "axios";
import { CredentialsQive } from "../../infra/http/qive/QiveApi";
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
  public constructor(readonly credentials: CredentialsQive) {}
  public async execute(cursor: string) {
    try {
      //fazer a chamada para a api da qive
      const url = `https://api.arquivei.com.br/v1/nfse/events?type[]=101101&cursor=${cursor}`;
      const headers = {
        "X-API-ID": this.credentials.apiId,
        "X-API-KEY": this.credentials.apiKey,
      };
      const res = await axios.get(url, { headers });
      const data = res.data;
      if (data.status && data.status.code && data.status.code !== 200) {
        console.error("Erro ao buscar nfse canceladas:", data.message);
        throw new Error(`Erro ao buscar nfse canceladas: ${data.message}`);
      }
      const content: QiveNfseEventsResponse = data;
      const cancelledIds = content.data.map((item) => item.id);
      if (content.count > 49) {
        console.error(
          "Limite de notas canceladas excedido. Verifique o cursor inserido"
        );
        throw new Error(
          "Limite de notas canceladas excedido. Verifique o cursor inserido"
        );
      }
      return { cancelledIds, nextCursor: this.extractCursorFromUrl(content) };
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
