"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCancelledNFSe = void 0;
class GetCancelledNFSe {
    constructor(qive) {
        this.qive = qive;
    }
    async execute(cursor) {
        try {
            const content = await this.qive.getCancelledNFSe(cursor?.toString() || null);
            const cancelledIds = content.data.map((item) => item.id);
            if (content.count > 49) {
                console.error("Limite de notas canceladas excedido. Verifique o cursor inserido");
                throw new Error("Limite de notas canceladas excedido. Verifique o cursor inserido");
            }
            return {
                cancelledIds,
                nextCursorQive: this.extractCursorFromUrl(content),
            };
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
