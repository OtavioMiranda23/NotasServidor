"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCancelledNFSe = void 0;
const axios_1 = __importDefault(require("axios"));
class GetCancelledNFSe {
    constructor(credentials) {
        this.credentials = credentials;
    }
    async execute(cursor) {
        try {
            const url = `https://api.arquivei.com.br/v1/nfse/events?type[]=101101&cursor=${cursor}`;
            const headers = {
                "X-API-ID": this.credentials.apiId,
                "X-API-KEY": this.credentials.apiKey,
            };
            const res = await axios_1.default.get(url, { headers });
            const data = res.data;
            if (data.status && data.status.code && data.status.code !== 200) {
                console.error("Erro ao buscar nfse canceladas:", data.message);
                throw new Error(`Erro ao buscar nfse canceladas: ${data.message}`);
            }
            const content = data;
            const cancelledIds = content.data.map((item) => item.id);
            if (content.count > 49) {
                console.error("Limite de notas canceladas excedido. Verifique o cursor inserido");
                throw new Error("Limite de notas canceladas excedido. Verifique o cursor inserido");
            }
            return { cancelledIds, nextCursor: this.extractCursorFromUrl(content) };
        }
        catch (error) {
            console.error("Erro ao buscar nfse canceladas:", error);
            throw new Error("Erro ao buscar nfse canceladas");
        }
    }
    extractCursorFromUrl(url) {
        let nextCursor = null;
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
exports.GetCancelledNFSe = GetCancelledNFSe;
