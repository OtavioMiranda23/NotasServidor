"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastCursor = void 0;
class GetLastCursor {
    constructor(zoho) {
        this.zoho = zoho;
    }
    async execute(linksNames) {
        const allCursors = await this.zoho.findAllItems(linksNames);
        if (!allCursors.success || allCursors.data.length === 0) {
            return null;
        }
        const first = allCursors.data[0];
        return first.ultimo_cursor;
    }
}
exports.GetLastCursor = GetLastCursor;
